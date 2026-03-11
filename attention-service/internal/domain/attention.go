package domain

type AttentionResult struct {
	Attention bool    `json:"attention"`
	Theta     float64 `json:"theta"`
	Alpha     float64 `json:"alpha"`
	Distance  float64 `json:"distance"`
}
