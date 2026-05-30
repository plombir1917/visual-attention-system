package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"analytics-service/internal/config"
	"analytics-service/internal/core/handler"
	kafkaconsumer "analytics-service/internal/infra/kafka"
	"analytics-service/internal/infra/postgres"
)

func main() {
	log := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	cfg, err := config.Load()
	if err != nil {
		log.Error("load config", "error", err)
		os.Exit(1)
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	db, err := postgres.New(ctx, cfg.Postgres.DSN)
	if err != nil {
		log.Error("connect postgres", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	consumer := kafkaconsumer.NewConsumer(*cfg)
	defer consumer.Close()

	h := handler.NewSessionHandler(consumer, db, log)

	log.Info("analytics-service started", "topic", cfg.Kafka.Topic, "group", cfg.Kafka.GroupID)
	h.Run(ctx)
	log.Info("analytics-service stopped")
}
