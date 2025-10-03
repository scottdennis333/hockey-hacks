package goalies

import (
	"log"
	"os"
)

type Goalie struct {
	PlayerID  int    `json:"PlayerID"`
	TeamID    int    `json:"TeamID"`
	Team      string `json:"Team"`
	FirstName string `json:"FirstName"`
	LastName  string `json:"LastName"`
	Confirmed bool   `json:"Confirmed"`
}

type Goalies struct {
	T1 Goalie `json:"col"`
	T2 Goalie `json:"det"`
}

type Game struct {
	HomeTeamID     int    `json:"HomeTeamID"`
	HomeTeam       string `json:"HomeTeam"`
	AwayTeamID     int    `json:"AwayTeamID"`
	AwayTeam       string `json:"AwayTeam"`
	HomeGoaltender Goalie `json:"HomeGoaltender"`
	AwayGoaltender Goalie `json:"AwayGoaltender"`
}

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
