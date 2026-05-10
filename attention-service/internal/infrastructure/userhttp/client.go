package userhttp

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"attention-service/internal/config"
	"attention-service/internal/domain"
	"attention-service/internal/port"
)

type Client struct {
	baseURL string
	http    *http.Client
}

func NewClient(cfg config.UserService) *Client {
	return &Client{
		baseURL: cfg.BaseURL,
		http:    &http.Client{Timeout: cfg.Timeout},
	}
}

func (c *Client) AuthorizeAPIKey(ctx context.Context, rawKey string) (*domain.User, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+"/authorize-api-key", nil)
	if err != nil {
		return nil, fmt.Errorf("build request: %w", err)
	}
	req.Header.Set("X-Api-Key", rawKey)

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("call user-service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusUnauthorized {
		return nil, port.ErrUnauthorized
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("user-service returned status %d", resp.StatusCode)
	}

	var user domain.User
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return nil, fmt.Errorf("decode user response: %w", err)
	}
	return &user, nil
}
