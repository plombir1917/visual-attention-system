package rediscache

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"time"

	"attention-service/internal/domain"

	goredis "github.com/redis/go-redis/v9"
)

type SessionStore struct {
	rdb *goredis.Client
}

func NewSessionStore(rdb *goredis.Client) *SessionStore {
	return &SessionStore{rdb: rdb}
}

func (s *SessionStore) Create(ctx context.Context, userID string, ttl time.Duration) (string, error) {
	id := newID()
	sess := domain.Session{
		ID:        id,
		UserID:    userID,
		StartedAt: time.Now().UTC(),
	}
	data, err := json.Marshal(sess)
	if err != nil {
		return "", fmt.Errorf("marshal session: %w", err)
	}
	if err := s.rdb.Set(ctx, sessionKey(id), data, ttl).Err(); err != nil {
		return "", fmt.Errorf("redis set session: %w", err)
	}
	return id, nil
}

// AppendAttention pushes one attention result onto the session's list and refreshes the TTL.
// Redis List semantics make this O(1) regardless of session length.
func (s *SessionStore) AppendAttention(ctx context.Context, sessionID string, result domain.AttentionResult, ttl time.Duration) error {
	data, err := json.Marshal(result)
	if err != nil {
		return fmt.Errorf("marshal attention result: %w", err)
	}
	key := attentionKey(sessionID)
	pipe := s.rdb.TxPipeline()
	pipe.RPush(ctx, key, data)
	pipe.Expire(ctx, key, ttl)
	if _, err := pipe.Exec(ctx); err != nil {
		return fmt.Errorf("redis append attention: %w", err)
	}
	return nil
}

func (s *SessionStore) Get(ctx context.Context, sessionID string) (domain.Session, error) {
	data, err := s.rdb.Get(ctx, sessionKey(sessionID)).Bytes()
	if err != nil {
		return domain.Session{}, fmt.Errorf("redis get session: %w", err)
	}
	var sess domain.Session
	if err := json.Unmarshal(data, &sess); err != nil {
		return domain.Session{}, fmt.Errorf("unmarshal session: %w", err)
	}
	return sess, nil
}

func (s *SessionStore) ListAttention(ctx context.Context, sessionID string) ([]domain.AttentionResult, error) {
	items, err := s.rdb.LRange(ctx, attentionKey(sessionID), 0, -1).Result()
	if err != nil {
		return nil, fmt.Errorf("redis lrange attention: %w", err)
	}
	results := make([]domain.AttentionResult, 0, len(items))
	for _, item := range items {
		var r domain.AttentionResult
		if err := json.Unmarshal([]byte(item), &r); err == nil {
			results = append(results, r)
		}
	}
	return results, nil
}

func sessionKey(id string) string   { return "session:" + id }
func attentionKey(id string) string { return "session:" + id + ":attention" }

func newID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
