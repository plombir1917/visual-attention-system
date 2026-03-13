package main

import (
	"attention-service/internal/api"
	"attention-service/internal/service"
	"attention-service/storage"
	"context"
	"fmt"
	"net/http"
	"time"
)

func main() {
	ctx := context.Background()

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

	attentionService := service.NewAttentionService(db)

	router := api.NewRouter(attentionService)

	fmt.Println("Server started on 8080")

	err = http.ListenAndServe(":8080", router)

	if err != nil {
		fmt.Println("ListenAndServe:", err)
	}

}
