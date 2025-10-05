package main

import (
	"hockey-hacks/pkg/goalies"
	"hockey-hacks/pkg/sportsData"
	"hockey-hacks/pkg/yahoo"
	"log"
	"os"
	"sync"

	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load("../../.env")

	f, err := os.OpenFile("./logs.log", os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
	if err != nil {
		log.Fatalln(err)
	}
	defer f.Close()

	log.SetOutput(f)

	log.Println("Starting Program")

	yahoo := yahoo.NewYahooClient()

	var wg sync.WaitGroup
	wg.Add(2)
	go yahoo.RefreshAuth(&wg)
	games, err := sportsData.GetStartingGoalies(&wg)
	wg.Wait()

	startingGoalies := goalies.GetTeamStartingGoalies(games)

	if err != nil {
		os.Exit(1)
	}
	yahoo.SwapPlayers(startingGoalies)

	log.Printf("Ending Program\n")
}
