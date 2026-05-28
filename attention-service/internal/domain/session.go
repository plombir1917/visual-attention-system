package domain

import "time"

type Session struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	StartedAt time.Time `json:"started_at"`
}

type SessionEndedEvent struct {
	SessionID string            `json:"session_id"`
	UserID    string            `json:"user_id"`
	StartedAt time.Time         `json:"started_at"`
	EndedAt   time.Time         `json:"ended_at"`
	Results   []AttentionResult `json:"results"`
}
