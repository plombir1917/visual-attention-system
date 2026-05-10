package port

import (
	"context"
	"time"

	"attention-service/internal/domain"
)

type SessionStore interface {
	Create(ctx context.Context, userID string, ttl time.Duration) (string, error)
	AppendAttention(ctx context.Context, sessionID string, result domain.AttentionResult, ttl time.Duration) error
}
