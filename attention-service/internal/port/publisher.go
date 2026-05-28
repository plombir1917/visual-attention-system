package port

import (
	"context"

	"attention-service/internal/domain"
)

type SessionPublisher interface {
	PublishSessionEnded(ctx context.Context, event domain.SessionEndedEvent) error
}
