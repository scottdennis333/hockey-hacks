package main

import (
	"hockey-hacks/pkg/lineup"
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

	log.Println("Starting Lineup Optimizer")

	yc := yahoo.NewYahooClient(false)

	var wg sync.WaitGroup
	wg.Add(1)
	go yc.RefreshAuth(&wg)
	wg.Wait()

	// Get the list of games for today
	games, err := sportsData.GetGamesByDate()
	if err != nil {
		log.Fatalln("Failed to get games for today:", err)
	}

	// Get the player priority list
	priorityList, err := lineup.GetPlayerPriority()
	if err != nil {
		log.Fatalln("Failed to get player priority list:", err)
	}

	// Get the current roster
	roster, err := lineup.GetRoster(yc)
	if err != nil {
		log.Fatalln("Failed to get roster:", err)
	}

	// Get the sorted list of active players
	sortedPlayers := lineup.GetSortedPlayers(priorityList, roster, games)

	// Get the optimized lineup
	optimizedLineup := lineup.OptimizeLineup(sortedPlayers)

	// Set the new roster
	var rosterToSet yahoo.OptimizedRoster
	rosterToSet.C = optimizedLineup.C
	rosterToSet.LW = optimizedLineup.LW
	rosterToSet.RW = optimizedLineup.RW
	rosterToSet.D = optimizedLineup.D
	rosterToSet.Util = optimizedLineup.Util
	rosterToSet.BN = optimizedLineup.BN

	yc.SetRoster(rosterToSet)

	log.Println("Ending Program\n")
}
