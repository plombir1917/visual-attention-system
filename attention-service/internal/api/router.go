package api

import (
	"attention-service/internal/api/handlers"
	"net/http"
)

func NewRouter() *http.ServeMux {
	mux := http.NewServeMux()

	mux.HandleFunc("/ws", handlers.HandleWS)

	return mux
}
