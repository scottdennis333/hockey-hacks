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
