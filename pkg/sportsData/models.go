// File: sportsData/models.go
package sportsData

type Player struct {
	Name               string  `json:"Name"`
	FantasyPointsYahoo float64 `json:"FantasyPointsYahoo"`
	ShotsOnGoal        float64 `json:"ShotsOnGoal"`
	PowerPlayGoals     float64 `json:"PowerPlayGoals"`
	ShortHandedGoals   float64 `json:"ShortHandedGoals"`
	PowerPlayAssists   float64 `json:"PowerPlayAssists"`
	ShortHandedAssists float64 `json:"ShortHandedAssists"`
	ShootoutGoals      float64 `json:"ShootoutGoals"`
	PlusMinus          float64 `json:"PlusMinus"`
	PenaltyMinutes     float64 `json:"PenaltyMinutes"`
	Blocks             float64 `json:"Blocks"`
	Hits               float64 `json:"Hits"`
	Goals              float64 `json:"Goals"`
	Assists            float64 `json:"Assists"`
}

type Goalie struct {
	PlayerID  int    `json:"PlayerID"`
	TeamID    int    `json:"TeamID"`
	Team      string `json:"Team"`
	FirstName string `json:"FirstName"`
	LastName  string `json:"LastName"`
	Confirmed bool   `json:"Confirmed"`
}

type Goalies []Goalie

type Game struct {
	HomeTeamID     int    `json:"HomeTeamID"`
	HomeTeam       string `json:"HomeTeam"`
	AwayTeamID     int    `json:"AwayTeamID"`
	AwayTeam       string `json:"AwayTeam"`
	HomeGoaltender Goalie `json:"HomeGoaltender"`
	AwayGoaltender Goalie `json:"AwayGoaltender"`
}

type Games []Game
