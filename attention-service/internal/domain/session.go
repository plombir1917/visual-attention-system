package domain

import "time"

type Session struct {
	ID        string    `json:"id"`
	UserID    string    `json:"user_id"`
	StartedAt time.Time `json:"started_at"`
}
