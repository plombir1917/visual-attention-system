package port

import (
	"context"
	"time"
)

type Cache interface {
	Set(ctx context.Context, key string, value []byte, ttl time.Duration) error
}
