package main

import (
	"analytics-service/internal/config"
	"os"
)

func main() {
	// TODO: implement config
	_, err := config.Load()
	if err != nil {
		os.Stderr.WriteString("load config: " + err.Error() + "\n")
		os.Exit(1)
	}

}
