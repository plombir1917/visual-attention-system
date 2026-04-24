package handlers

import (
	"attention-service/internal/service"
	"attention-service/pkg/ws"
	"fmt"
	"net/http"

	"github.com/gorilla/websocket"
)

type WSHandler struct {
	attentionService *service.AttentionService
}

const modelWsAddr = "ws://localhost:8765/attention" //FIXME

func NewWSHandler(attentionService *service.AttentionService) *WSHandler {
	return &WSHandler{attentionService: attentionService}
}

func (h *WSHandler) HandleWS(w http.ResponseWriter, r *http.Request) {
	clientWS, err := ws.Upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println(err)
		return
	}
	defer clientWS.Close()

	modelWS, _, err := websocket.DefaultDialer.Dial(modelWsAddr, nil)
	if err != nil {
		fmt.Println("Model connection error:", err)
		return
	}
	defer modelWS.Close()

	fmt.Println("Client connected")

	ctx := r.Context()

	h.attentionService.ProcessMessage(ctx, clientWS, modelWS)
}
