package service

import (
	"fmt"

	"github.com/gorilla/websocket"
)

func ProcessMessage(clientWS *websocket.Conn, modelWS *websocket.Conn) {
	for {
		// читаем сообщение
		_, msg, err := clientWS.ReadMessage()
		if err != nil {
			fmt.Println("Read message:", err)
			break
		}

		// отправляем сообщение в модель
		err = modelWS.WriteMessage(websocket.TextMessage, msg)
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

		// отправляем клиенту полученное сообщение из модели
		if err = clientWS.WriteMessage(websocket.TextMessage, msg); err != nil {
			fmt.Println("Write message:", err)
			break
		}
	}
}
