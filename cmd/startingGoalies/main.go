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

type result struct {
	goalies sportsData.Goalies
	err     error
}

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

	resultChan := make(chan result, 1)

	wg.Add(2)
	go yahoo.RefreshAuth(&wg)
	go func() {
		defer wg.Done()
		games, err := sportsData.GetStartingGoalies()
		if err != nil {
			resultChan <- result{err: err}
			return
		}
		startingGoalies := goalies.GetTeamStartingGoalies(games)
		resultChan <- result{goalies: startingGoalies, err: nil}
	}()
	wg.Wait()

	res := <-resultChan
	if res.err != nil {
		os.Exit(1)
	}
	if len(res.goalies) == 0 {
		log.Println("No starting goalies found.")
		os.Exit(0)
	}

	yahoo.SwapPlayers(res.goalies)

	log.Printf("Ending Program\n")
}
