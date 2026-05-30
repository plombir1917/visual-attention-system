package domain

import "time"

type AttentionRecord struct {
	Focus      bool      `json:"focus"`
	Theta      float64   `json:"theta"`
	Alpha      float64   `json:"alpha"`
	Distance   float64   `json:"distance"`
	GazeVector []float64 `json:"gaze_vector"`
}

type SessionEndedEvent struct {
	SessionID string            `json:"session_id"`
	UserID    string            `json:"user_id"`
	StartedAt time.Time         `json:"started_at"`
	EndedAt   time.Time         `json:"ended_at"`
	Results   []AttentionRecord `json:"results"`
}
