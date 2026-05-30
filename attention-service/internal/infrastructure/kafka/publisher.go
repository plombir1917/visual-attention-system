package kafkapub

import (
	"context"
	"encoding/json"
	"fmt"

	"attention-service/internal/domain"

	"github.com/segmentio/kafka-go"
)

type Publisher struct {
	writer *kafka.Writer
}

func NewPublisher(brokers []string, topic string) *Publisher {
	return &Publisher{
		writer: &kafka.Writer{
			Addr:     kafka.TCP(brokers...),
			Topic:    topic,
			Balancer: &kafka.LeastBytes{},
		},
	}
}

func (p *Publisher) PublishSessionEnded(ctx context.Context, event domain.SessionEndedEvent) error {
	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("marshal session ended event: %w", err)
	}
	return p.writer.WriteMessages(ctx, kafka.Message{
		Key:   []byte(event.SessionID),
		Value: data,
	})
}

func (p *Publisher) Close() error {
	return p.writer.Close()
}
