package goalies

import (
	"hockey-hacks/pkg/sportsData"
	"log"
	"os"
)

func GetTeamStartingGoalies(games sportsData.Games) sportsData.Goalies {
	var startingGoalies sportsData.Goalies
	team1 := os.Getenv("TEAM1_ABBR")
	team2 := os.Getenv("TEAM2_ABBR")
	for _, n := range games {
		if n.HomeTeam == team1 {
			startingGoalies = append(startingGoalies, n.HomeGoaltender)
		} else if n.HomeTeam == team2 {
			startingGoalies = append(startingGoalies, n.HomeGoaltender)
		}
		if n.AwayTeam == team1 {
			startingGoalies = append(startingGoalies, n.AwayGoaltender)
		} else if n.AwayTeam == team2 {
			startingGoalies = append(startingGoalies, n.AwayGoaltender)
		}
	}
	log.Println(startingGoalies)
	return startingGoalies
}
