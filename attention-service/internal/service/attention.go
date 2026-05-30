package service

import (
	"context"
	"encoding/json"
	"log/slog"
	"time"

	"attention-service/internal/domain"
	"attention-service/internal/port"

	"github.com/gorilla/websocket"
)

type AttentionService struct {
	sessions  port.SessionStore
	publisher port.SessionPublisher
	ttl       time.Duration
	log       *slog.Logger
}

func New(sessions port.SessionStore, publisher port.SessionPublisher, ttl time.Duration, log *slog.Logger) *AttentionService {
	return &AttentionService{
		sessions:  sessions,
		publisher: publisher,
		ttl:       ttl,
		log:       log.With("component", "attention_service"),
	}
}

// RelaySession creates a Redis session for userID, then proxies frames between
// the client WebSocket and the attention model, appending each result to the session.
// When the session ends (for any reason), publishes a SessionEndedEvent to Kafka.
func (s *AttentionService) RelaySession(ctx context.Context, clientWS *websocket.Conn, model port.ModelClient, userID string) {
	sessionID, err := s.sessions.Create(ctx, userID, s.ttl)
	if err != nil {
		s.log.ErrorContext(ctx, "session create failed", "error", err)
		return
	}
	s.log.InfoContext(ctx, "session created", "session_id", sessionID, "user_id", userID)
	defer s.publishSessionEnded(sessionID)

	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		_, frame, err := clientWS.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				s.log.WarnContext(ctx, "client read error", "error", err)
			}
			return
		}

		result, err := model.ProcessFrame(ctx, frame)
		if err != nil {
			s.log.ErrorContext(ctx, "model processing failed", "error", err)
			return
		}

		var attResult domain.AttentionResult
		if err := json.Unmarshal(result, &attResult); err == nil {
			if storeErr := s.sessions.AppendAttention(ctx, sessionID, attResult, s.ttl); storeErr != nil {
				s.log.WarnContext(ctx, "session append failed", "error", storeErr)
			}
		}

		if err := clientWS.WriteMessage(websocket.TextMessage, result); err != nil {
			s.log.WarnContext(ctx, "client write error", "error", err)
			return
		}
	}
}

func (s *AttentionService) publishSessionEnded(sessionID string) {
	ctx := context.Background()
	sess, err := s.sessions.Get(ctx, sessionID)
	if err != nil {
		s.log.Error("session ended publish: get session", "session_id", sessionID, "error", err)
		return
	}
	results, err := s.sessions.ListAttention(ctx, sessionID)
	if err != nil {
		s.log.Error("session ended publish: list attention", "session_id", sessionID, "error", err)
		return
	}
	event := domain.SessionEndedEvent{
		SessionID: sessionID,
		UserID:    sess.UserID,
		StartedAt: sess.StartedAt,
		EndedAt:   time.Now().UTC(),
		Results:   results,
	}
	if err := s.publisher.PublishSessionEnded(ctx, event); err != nil {
		s.log.Error("session ended publish: kafka", "session_id", sessionID, "error", err)
	}
}
