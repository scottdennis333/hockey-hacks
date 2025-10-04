package goalies

import (
	"log"
	"os"
)

func DetermineStaringGoalies(games []Game) Goalies {
	var startingGoalies Goalies
	team1 := os.Getenv("TEAM1_ABBR")
	team2 := os.Getenv("TEAM2_ABBR")
	for _, n := range games {
		switch n.HomeTeam {
		case team1:
			startingGoalies.T1 = n.HomeGoaltender
		case team2:
			startingGoalies.T2 = n.HomeGoaltender
		}
		switch n.AwayTeam {
		case team1:
			startingGoalies.T1 = n.AwayGoaltender
		case team2:
			startingGoalies.T2 = n.AwayGoaltender
		}
	}
	log.Println(startingGoalies)
	return startingGoalies
}
