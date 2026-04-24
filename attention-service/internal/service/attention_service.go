package service

import (
	"context"
	"fmt"
	"time"

	"github.com/gorilla/websocket"
	"github.com/redis/go-redis/v9"
)

type AttentionService struct {
	redis *redis.Client
}

func NewAttentionService(redis *redis.Client) *AttentionService {
	return &AttentionService{
		redis: redis,
	}
}

func (as *AttentionService) ProcessMessage(ctx context.Context, clientWS *websocket.Conn, modelWS *websocket.Conn) {

	for {
		// читаем сообщение
		_, msg, err := clientWS.ReadMessage()
		if err != nil {
			fmt.Println("Read message:", err)
			break
		}

		// отправляем сообщение в модель
		err = modelWS.WriteMessage(websocket.BinaryMessage, msg)
		if err != nil {
			fmt.Println("Model write:", err)
			break
		}

		// получаем сообщение из модели
		_, msg, err = modelWS.ReadMessage()
		if err != nil {
			fmt.Println("Model read:", err)
			break
		}

		// REDIS HERE
		if err := as.redis.Set(ctx, time.Now().String(), msg, 2*time.Hour).Err(); err != nil {
			fmt.Printf("failed to set data, error: %s", err.Error())
		}
		//

		// отправляем клиенту полученное сообщение из модели
		if err = clientWS.WriteMessage(websocket.TextMessage, msg); err != nil {
			fmt.Println("Write message:", err)
			break
		}
	}
}
