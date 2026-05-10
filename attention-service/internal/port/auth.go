package port

import (
	"context"
	"errors"

	"attention-service/internal/domain"
)

var ErrUnauthorized = errors.New("unauthorized")

type AuthClient interface {
	AuthorizeAPIKey(ctx context.Context, rawKey string) (*domain.User, error)
}
