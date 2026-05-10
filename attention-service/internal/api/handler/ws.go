package handler

import (
	"errors"
	"log/slog"
	"net/http"
	"time"

	"attention-service/internal/port"
	"attention-service/internal/service"

	"github.com/gorilla/websocket"
)

const (
	maxMessageSize     = 1 << 20 // 1 MB
	clientWriteTimeout = 10 * time.Second
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  4096,
	WriteBufferSize: 4096,
	CheckOrigin:     func(_ *http.Request) bool { return true },
}

type WSHandler struct {
	svc     *service.AttentionService
	factory port.ModelClientFactory
	auth    port.AuthClient
	log     *slog.Logger
}

func NewWSHandler(svc *service.AttentionService, factory port.ModelClientFactory, auth port.AuthClient, log *slog.Logger) *WSHandler {
	return &WSHandler{svc: svc, factory: factory, auth: auth, log: log}
}

func (h *WSHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	rawKey := r.Header.Get("X-Api-Key")
	if rawKey == "" {
		rawKey = r.URL.Query().Get("api_key")
	}
	if rawKey == "" {
		http.Error(w, "api key required", http.StatusUnauthorized)
		return
	}

	user, err := h.auth.AuthorizeAPIKey(r.Context(), rawKey)
	if err != nil {
		if errors.Is(err, port.ErrUnauthorized) {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		h.log.ErrorContext(r.Context(), "auth service error", "error", err)
		http.Error(w, "auth service unavailable", http.StatusServiceUnavailable)
		return
	}

	clientWS, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		h.log.ErrorContext(r.Context(), "ws upgrade failed", "error", err)
		return
	}
	defer clientWS.Close()

	clientWS.SetReadLimit(maxMessageSize)

	model, err := h.factory.New(r.Context())
	if err != nil {
		h.log.ErrorContext(r.Context(), "model connection failed", "error", err)
		_ = clientWS.WriteControl(
			websocket.CloseMessage,
			websocket.FormatCloseMessage(websocket.CloseInternalServerErr, "model unavailable"),
			time.Now().Add(clientWriteTimeout),
		)
		return
	}
	defer model.Close()

	h.log.InfoContext(r.Context(), "session started", "remote_addr", r.RemoteAddr, "user_id", user.ID)
	defer h.log.InfoContext(r.Context(), "session ended", "remote_addr", r.RemoteAddr, "user_id", user.ID)

	h.svc.RelaySession(r.Context(), clientWS, model, user.ID)
}
