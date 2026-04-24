package api

import (
	"attention-service/internal/api/handlers"
	"attention-service/internal/service"
	"net/http"
)

func NewRouter(attentionService *service.AttentionService) *http.ServeMux {
	mux := http.NewServeMux()

	wsHandler := handlers.NewWSHandler(attentionService)

	mux.HandleFunc("/ws", wsHandler.HandleWS)

	return mux
}
