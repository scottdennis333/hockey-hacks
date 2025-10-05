package sportsData

import (
	"encoding/json"
	"hockey-hacks/pkg/email"
	"io"
	"log"
	"net/http"
	"os"
	"sync"
	"time"
)

const (
	SportsDataAPIBaseURL = "https://api.sportsdata.io/v3/nhl"
)

func GetStartingGoalies(wg *sync.WaitGroup) (Games, error) {
	defer wg.Done()

	date := time.Now().Format("2006-01-02")
	sportsDataUrl := SportsDataAPIBaseURL + "/projections/json/StartingGoaltendersByDate/" + date

	respBody, err := sendRequest(http.MethodGet, sportsDataUrl, nil)

	if err != nil {
		email.SendEmail(respBody)
		log.Fatalln("Failed to get starting goalies")
		return nil, err
	}
	var games Games
	json.Unmarshal([]byte(respBody), &games)

	return games, nil
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
