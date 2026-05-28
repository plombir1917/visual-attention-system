package config

import (
	"fmt"
	"time"

	"github.com/kelseyhightower/envconfig"
)

type Config struct {
	Server      Server
	Redis       Redis
	Model       Model
	UserService UserService
	Kafka       Kafka
}

type Kafka struct {
	Brokers []string `envconfig:"BROKER" default:"localhost:9092"`
	Topic   string   `envconfig:"TOPIC" default:"session.ended"`
}

type Server struct {
	Port              string        `envconfig:"PORT" default:"8080"`
	Env               string        `envconfig:"ENV" default:"development"`
	ReadHeaderTimeout time.Duration `envconfig:"READ_HEADER_TIMEOUT" default:"10s"`
	IdleTimeout       time.Duration `envconfig:"IDLE_TIMEOUT" default:"60s"`
	ShutdownTimeout   time.Duration `envconfig:"SHUTDOWN_TIMEOUT" default:"30s"`
}

type Redis struct {
	Addr     string        `envconfig:"ADDR" required:"true"`
	Password string        `envconfig:"PASSWORD" default:""`
	DB       int           `envconfig:"DB" default:"0"`
	TTL      time.Duration `envconfig:"TTL" default:"2h"`
}

type Model struct {
	GRPCAddr    string        `envconfig:"GRPC_ADDR" default:"localhost:50051"`
	DialTimeout time.Duration `envconfig:"DIAL_TIMEOUT" default:"10s"`
}

type UserService struct {
	BaseURL string        `envconfig:"BASE_URL" default:"http://localhost:3000"`
	Timeout time.Duration `envconfig:"TIMEOUT" default:"5s"`
}

func Load() (*Config, error) {
	var cfg Config
	if err := envconfig.Process("SERVER", &cfg.Server); err != nil {
		return nil, fmt.Errorf("server config: %w", err)
	}
	if err := envconfig.Process("REDIS", &cfg.Redis); err != nil {
		return nil, fmt.Errorf("redis config: %w", err)
	}
	if err := envconfig.Process("MODEL", &cfg.Model); err != nil {
		return nil, fmt.Errorf("model config: %w", err)
	}
	if err := envconfig.Process("USER_SERVICE", &cfg.UserService); err != nil {
		return nil, fmt.Errorf("user service config: %w", err)
	}
	if err := envconfig.Process("KAFKA", &cfg.Kafka); err != nil {
		return nil, fmt.Errorf("kafka config: %w", err)
	}
	return &cfg, nil
}
