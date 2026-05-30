package handler

import (
	"context"
	"encoding/json"
	"log/slog"

	"analytics-service/internal/domain"
	kafkaconsumer "analytics-service/internal/infra/kafka"
	"analytics-service/internal/infra/postgres"
)

type SessionHandler struct {
	consumer *kafkaconsumer.Consumer
	db       *postgres.Writer
	log      *slog.Logger
}

func NewSessionHandler(consumer *kafkaconsumer.Consumer, db *postgres.Writer, log *slog.Logger) *SessionHandler {
	return &SessionHandler{consumer: consumer, db: db, log: log}
}

func (h *SessionHandler) Run(ctx context.Context) {
	for {
		if ctx.Err() != nil {
			return
		}

		msg, err := h.consumer.ReadMessage(ctx)
		if err != nil {
			if ctx.Err() != nil {
				return
			}
			h.log.Error("read kafka message", "error", err)
			continue
		}

		var event domain.SessionEndedEvent
		if err := json.Unmarshal(msg.Value, &event); err != nil {
			h.log.Error("unmarshal session ended event", "error", err)
			_ = h.consumer.CommitMessage(ctx, msg)
			continue
		}

		if err := h.db.SaveSession(ctx, event); err != nil {
			h.log.Error("save session to postgres", "session_id", event.SessionID, "error", err)
			continue
		}

		if err := h.consumer.CommitMessage(ctx, msg); err != nil {
			h.log.Error("commit kafka message", "error", err)
		}

		h.log.Info("session saved", "session_id", event.SessionID, "results", len(event.Results))
	}
}
