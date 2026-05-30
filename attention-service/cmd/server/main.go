package main

import (
	"context"
	"errors"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"attention-service/internal/api"
	"attention-service/internal/api/handler"
	"attention-service/internal/api/middleware"
	"attention-service/internal/config"
	kafkapub "attention-service/internal/infrastructure/kafka"
	"attention-service/internal/infrastructure/modelgrpc"
	rediscache "attention-service/internal/infrastructure/redis"
	"attention-service/internal/infrastructure/userhttp"
	"attention-service/internal/service"
	"attention-service/pkg/logger"

	"github.com/redis/go-redis/v9"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		os.Stderr.WriteString("load config: " + err.Error() + "\n")
		os.Exit(1)
	}

	log := logger.New(cfg.Server.Env)
	ctx := context.Background()

	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.Redis.Addr,
		Password: cfg.Redis.Password,
		DB:       cfg.Redis.DB,
	})
	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Error("redis ping failed", "error", err)
		os.Exit(1)
	}
	defer rdb.Close()

	sessions := rediscache.NewSessionStore(rdb)

	publisher := kafkapub.NewPublisher(cfg.Kafka.Brokers, cfg.Kafka.Topic)
	defer publisher.Close()

	modelFactory, err := modelgrpc.NewFactory(cfg.Model)
	if err != nil {
		log.Error("grpc factory init failed", "error", err)
		os.Exit(1)
	}
	defer modelFactory.Close()

	authClient := userhttp.NewClient(cfg.UserService)
	svc := service.New(sessions, publisher, cfg.Redis.TTL, log)

	mux := http.NewServeMux()
	mux.Handle("/ws", handler.NewWSHandler(svc, modelFactory, authClient, log))
	mux.HandleFunc("/health", handler.Health)

	chain := middleware.Recovery(log)(middleware.Logging(log)(mux))
	srv := api.NewServer(cfg.Server, chain)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Info("server started", "port", cfg.Server.Port, "env", cfg.Server.Env)
		if err := srv.Run(); !errors.Is(err, http.ErrServerClosed) {
			log.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	<-quit
	log.Info("shutting down gracefully")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), cfg.Server.ShutdownTimeout)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Error("shutdown error", "error", err)
		os.Exit(1)
	}

	log.Info("server stopped")
}
