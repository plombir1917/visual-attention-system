package api

import (
	"context"
	"fmt"
	"net/http"

	"attention-service/internal/config"
)

type Server struct {
	srv *http.Server
}

func NewServer(cfg config.Server, handler http.Handler) *Server {
	return &Server{
		srv: &http.Server{
			Addr:              fmt.Sprintf(":%s", cfg.Port),
			Handler:           handler,
			ReadHeaderTimeout: cfg.ReadHeaderTimeout,
			IdleTimeout:       cfg.IdleTimeout,
		},
	}
}

func (s *Server) Run() error {
	return s.srv.ListenAndServe()
}

func (s *Server) Shutdown(ctx context.Context) error {
	return s.srv.Shutdown(ctx)
}
