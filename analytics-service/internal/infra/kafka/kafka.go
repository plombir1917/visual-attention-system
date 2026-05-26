package kafka

import (
	"analytics-service/internal/config"

	"github.com/segmentio/kafka-go"
)

type KafkaConsumer struct {
	reader *kafka.Reader
}

func NewKafkaReader(cfg config.Config) *KafkaConsumer {
	return &KafkaConsumer{
		reader: kafka.NewReader(kafka.ReaderConfig{
			Brokers: cfg.Kafka.Brokers,
		}),
	}

}
