package goalies

import (
	"log"
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
	COL Goalie `json:"col"`
	DET Goalie `json:"det"`
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
	for _, n := range games {
		switch n.HomeTeam {
		case "COL":
			startingGoalies.COL = n.HomeGoaltender
			break
		case "DET":
			startingGoalies.DET = n.HomeGoaltender
			break
		}
		switch n.AwayTeam {
		case "COL":
			startingGoalies.COL = n.AwayGoaltender
			break
		case "DET":
			startingGoalies.DET = n.AwayGoaltender
			break
		}
	}
	log.Println(startingGoalies)
	return startingGoalies
}
