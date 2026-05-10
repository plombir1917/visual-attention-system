package port

import "context"

type ModelClient interface {
	ProcessFrame(ctx context.Context, frame []byte) ([]byte, error)
	Close() error
}

type ModelClientFactory interface {
	New(ctx context.Context) (ModelClient, error)
}
