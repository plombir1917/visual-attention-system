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
	sessions port.SessionStore
	ttl      time.Duration
	log      *slog.Logger
}

func New(sessions port.SessionStore, ttl time.Duration, log *slog.Logger) *AttentionService {
	return &AttentionService{
		sessions: sessions,
		ttl:      ttl,
		log:      log.With("component", "attention_service"),
	}
}

// RelaySession creates a Redis session for userID, then proxies frames between
// the client WebSocket and the attention model, appending each result to the session.
func (s *AttentionService) RelaySession(ctx context.Context, clientWS *websocket.Conn, model port.ModelClient, userID string) {
	sessionID, err := s.sessions.Create(ctx, userID, s.ttl)
	if err != nil {
		s.log.ErrorContext(ctx, "session create failed", "error", err)
		return
	}
	s.log.InfoContext(ctx, "session created", "session_id", sessionID, "user_id", userID)

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
