package config

import (
	"fmt"
	"time"

	"github.com/kelseyhightower/envconfig"
)

type Config struct {
	Server Server
	Kafka  Kafka
}

type Server struct {
	Port              string        `envconfig:"PORT" default:"8081"`
	Env               string        `envconfig:"ENV" default:"development"`
	ReadHeaderTimeout time.Duration `envconfig:"READ_HEADER_TIMEOUT" default:"10s"`
	IdleTimeout       time.Duration `envconfig:"IDLE_TIMEOUT" default:"60s"`
	ShutdownTimeout   time.Duration `envconfig:"SHUTDOWN_TIMEOUT" default:"30s"`
}

type Kafka struct {
	Brokers  []string `envconfig:"BROKER" default:"localhost:9092"`
	ClientID string   `envconfig:"CLIENT_ID" default:"analytics-service"`
}

func Load() (*Config, error) {
	var cfg Config
	if err := envconfig.Process("SERVER", &cfg.Server); err != nil {
		return nil, fmt.Errorf("server config: %w", err)
	}

	if err := envconfig.Process("KAFKA", &cfg.Kafka); err != nil {
		return nil, fmt.Errorf("kafka config: %w", err)
	}

	return &cfg, nil
}
