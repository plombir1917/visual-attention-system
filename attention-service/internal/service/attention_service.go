package service

import (
	"attention-service/storage"
	"context"
	"fmt"
	"time"

	"github.com/gorilla/websocket"
)

var ctx = context.Background()

func ProcessMessage(clientWS *websocket.Conn, modelWS *websocket.Conn) {
	cfg := storage.Config{
		Addr:        "",
		Password:    "",
		User:        "",
		DB:          11,
		MaxRetries:  10,
		DialTimeout: time.Second * 10,
		Timeout:     time.Second * 10,
	}

	db, err := storage.NewClient(ctx, cfg)
	if err != nil {
		panic(err)
	}

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
		if err := db.Set(ctx, time.Now().String(), msg, 2*time.Hour).Err(); err != nil {
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
