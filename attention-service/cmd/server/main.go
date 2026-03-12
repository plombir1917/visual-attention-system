package main

import (
	"attention-service/internal/api"
	"fmt"
	"net/http"
)

func main() {
	router := api.NewRouter()

	fmt.Println("Server started on 8080")

	err := http.ListenAndServe(":8080", router)
	if err != nil {
		fmt.Println("ListenAndServe:", err)
	}

}
