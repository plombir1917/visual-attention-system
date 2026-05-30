package domain

type AttentionResult struct {
	Focus      bool      `json:"focus"`
	Theta      float64   `json:"theta"`
	Alpha      float64   `json:"alpha"`
	Distance   float64   `json:"distance"`
	GazeVector []float64 `json:"gaze_vector"`
}
