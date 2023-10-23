package sportsData

import (
	"encoding/json"
	"fmt"
	"hockey-hacks/pkg/email"
	"hockey-hacks/pkg/goalies"
	"io"
	"log"
	"net/http"
	"os"
	"sync"
	"time"
)


type Player struct {
	Name                  string  `json:"Name"`
	FantasyPointsYahoo    float64 `json:"FantasyPointsYahoo"`
	ShotsOnGoal           float64 `json:"ShotsOnGoal"`
	PowerPlayGoals        float64 `json:"PowerPlayGoals"`
	ShortHandedGoals      float64 `json:"ShortHandedGoals"`
	PowerPlayAssists      float64 `json:"PowerPlayAssists"`
	ShortHandedAssists    float64 `json:"ShortHandedAssists"`
	ShootoutGoals         float64 `json:"ShootoutGoals"`
	PlusMinus             float64 `json:"PlusMinus"`
	PenaltyMinutes        float64 `json:"PenaltyMinutes"`
	Blocks                float64 `json:"Blocks"`
	Hits                  float64 `json:"Hits"`
	Goals                 float64 `json:"Goals"`
	Assists               float64 `json:"Assists"`
}

func GetStartingGoalies(wg *sync.WaitGroup) (goalies.Goalies, error) {
	defer wg.Done()

	date := time.Now().Format("2006-01-02")
	sportsDataUrl := "https://api.sportsdata.io/v3/nhl/projections/json/StartingGoaltendersByDate/" + date

	respBody, err := sendRequest("GET", sportsDataUrl, nil)

	if err != nil {
		email.SendEmail(respBody)
		log.Fatalln("Failed to get starting goalies")
		return goalies.Goalies{}, err
	}
	var games []goalies.Game
	json.Unmarshal([]byte(respBody), &games)

	return goalies.DetermineStaringGoalies(games), nil
}

func GetGameProjections() []Player {
	date := time.Now().Format("2006-01-02")
	sportsDataUrl := "https://api.sportsdata.io/v3/nhl/projections/json/PlayerGameProjectionStatsByDate/" + date

	respBody, err := sendRequest("GET", sportsDataUrl, nil)

	if err != nil {
		fmt.Println(respBody)
		email.SendEmail(respBody)
		log.Fatalln("Failed to get starting goalies")
	}

	var players []Player
	json.Unmarshal([]byte(respBody), &players)

	for _, player := range players {
		player.FantasyPointsYahoo = calculateFantasyScore(player)
	}

	return players
}

func calculateFantasyScore(player Player) float64 {
	averageGoalsPerGame := 3.18
    averageGoalsPerTeam := averageGoalsPerGame / 2.0
    probabilityGameWinningGoal := 1 / averageGoalsPerTeam

	goalsWeight := 25.0 * (1 + probabilityGameWinningGoal)
	assistsWeight := 25.0
	plusMinusWeight := 5.0
	penaltyMinutesWeight := 1.50
	powerplayPointsWeight := 10.0
	shorthandedPointsWeight := 20.0
	shotsOnGoalWeight := 2.0
	hitsWeight := 1.50
	blocksWeight := 2.0

	fantasyScore := (player.Goals * goalsWeight) +
		(player.Assists * assistsWeight) +
		(player.PlusMinus * plusMinusWeight) +
		(player.PenaltyMinutes * penaltyMinutesWeight) +
		((player.PowerPlayGoals + player.PowerPlayAssists) * powerplayPointsWeight) +
		((player.ShortHandedGoals + player.ShortHandedAssists) * shorthandedPointsWeight) +
		(player.ShotsOnGoal * shotsOnGoalWeight) +
		(player.Hits * hitsWeight) +
		(player.Blocks * blocksWeight)

		log.Println(player.Name, fantasyScore)
	return fantasyScore
}

func sendRequest(method string, url string, body io.Reader) ([]byte, error) {
	client := http.Client{}
	req, err := http.NewRequest(method, url, nil)
	if err != nil {
		log.Fatalln(err)
	}
	req.Header = http.Header{
		"Content-Type":              {"application/json"},
		"Ocp-Apim-Subscription-Key": {os.Getenv("SPORTS_DATA_KEY")},
	}
	resp, err := client.Do(req)
	if err != nil {
		log.Fatalln(err)
	}

	respBody, err := io.ReadAll(resp.Body)

	if err != nil {
		log.Fatalln(err)
		return nil, err
	} else if resp.StatusCode != 200 {
		log.Fatalln("Sports Data API Error")
		return respBody, err
	}
	return respBody, nil
}
