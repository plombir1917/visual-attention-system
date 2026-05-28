package postgres

import (
	"context"
	"fmt"

	"analytics-service/internal/domain"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Writer struct {
	pool *pgxpool.Pool
}

func New(ctx context.Context, dsn string) (*Writer, error) {
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil, fmt.Errorf("pgxpool connect: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("pgxpool ping: %w", err)
	}
	return &Writer{pool: pool}, nil
}

// SaveSession writes session metadata and all attention records to the shared
// Prisma-managed tables "session" and "attention" in a single transaction.
func (w *Writer) SaveSession(ctx context.Context, event domain.SessionEndedEvent) error {
	tx, err := w.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	_, err = tx.Exec(ctx,
		`INSERT INTO "session" (id, user_id, started_at, ended_at)
		 VALUES ($1, $2, $3, $4)
		 ON CONFLICT (id) DO NOTHING`,
		event.SessionID, event.UserID, event.StartedAt, event.EndedAt,
	)
	if err != nil {
		return fmt.Errorf("insert session: %w", err)
	}

	for _, r := range event.Results {
		_, err = tx.Exec(ctx,
			`INSERT INTO "attention" (id, session_id, focus, teta, alpha, distance)
			 VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
			event.SessionID, r.Focus, r.Theta, r.Alpha, r.Distance,
		)
		if err != nil {
			return fmt.Errorf("insert attention: %w", err)
		}
	}

	return tx.Commit(ctx)
}

func (w *Writer) Close() {
	w.pool.Close()
}
