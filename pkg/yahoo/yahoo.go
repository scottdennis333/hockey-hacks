// File: yahoo/yahoo.go
package yahoo

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"encoding/xml"
	"hockey-hacks/pkg/email"
	"hockey-hacks/pkg/goalies"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"

	"golang.org/x/oauth2/endpoints"
)

const (
	YahooFantasyAPIBaseURL = "https://fantasysports.yahooapis.com/fantasy/v2"
)

type YahooClient struct {
	Auth YahooAuth
}

func NewYahooClient() *YahooClient {
	return &YahooClient{}
}

func (yc *YahooClient) RefreshAuth(wg *sync.WaitGroup) {
	defer wg.Done()

	tok := base64.StdEncoding.EncodeToString([]byte(os.Getenv("YAHOO_CLIENT_ID") + ":" + os.Getenv("YAHOO_CLIENT_SECRET")))

	data := url.Values{}
	data.Set("grant_type", "refresh_token")
	data.Set("redirect_uri", "oob")
	data.Set("refresh_token", os.Getenv("YAHOO_REFRESH_TOKEN"))

	client := http.Client{}
	req, err := http.NewRequest("POST", endpoints.Yahoo.TokenURL, strings.NewReader(data.Encode()))
	if err != nil {
		log.Fatalln(err)
	}
	req.Header = http.Header{
		"Authorization": {"Basic " + tok},
		"Content-Type":  {"application/x-www-form-urlencoded"},
	}
	resp, err := client.Do(req)
	if err != nil {
		log.Fatalln(err)
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Fatalln(err)
	}

	if resp.StatusCode == 200 {
		json.Unmarshal([]byte(body), &yc.Auth)
	} else {
		email.SendEmail(body)
		log.Fatalf("Yahoo Auth Failed: %s", string(body))
		os.Exit(1)
	}
}

func (yc *YahooClient) GetRosterPlayers() ([]Player, error) {
	url := YahooFantasyAPIBaseURL + "/team/" + os.Getenv("YAHOO_LEAGUE_ID") + ".t." + os.Getenv("YAHOO_TEAM_ID") + "/roster/players"
	respBody, err := yc.sendXMLRequest(http.MethodGet, url, nil)

	if err != nil {
		email.SendEmail(respBody)
		log.Fatalln("Failed to get starting goalies")
		return []Player{}, err
	}
	var fantasyContent FantasyContent
	err = xml.Unmarshal([]byte(respBody), &fantasyContent)
	if err != nil {
		log.Println("Error unmarshaling XML:", err)
		return []Player{}, err
	}

	return fantasyContent.Team.Roster.Players.PlayerList, nil
}

func (yc *YahooClient) SwapPlayers(teamGoalies goalies.Goalies) {
	var requestBody AddPlayers
	requestBody.Roster.CoverageType = "date"
	requestBody.Roster.Date = time.Now().Format("2006-01-02")

	// Team 1 Goalies
	team1G1 := AddPlayer{PlayerKey: os.Getenv("TEAM1_G1")}
	team1G2 := AddPlayer{PlayerKey: os.Getenv("TEAM1_G2")}
	// Team 2 Goalies
	team2G1 := AddPlayer{PlayerKey: os.Getenv("TEAM2_G1")}
	team2G2 := AddPlayer{PlayerKey: os.Getenv("TEAM2_G2")}

	team1G1Last := os.Getenv("TEAM1_G1_LASTNAME")
	team1G2Last := os.Getenv("TEAM1_G2_LASTNAME")
	team2G1Last := os.Getenv("TEAM2_G1_LASTNAME")
	team2G2Last := os.Getenv("TEAM2_G2_LASTNAME")

	if teamGoalies.T1 == (goalies.Goalie{}) && teamGoalies.T2 == (goalies.Goalie{}) {
		return
	}
	if teamGoalies.T1 == (goalies.Goalie{}) {
		team1G1.Position, team1G2.Position = "G", "G"
		team2G1.Position, team2G2.Position = "BN", "BN"
	} else if teamGoalies.T2 == (goalies.Goalie{}) {
		team1G1.Position, team1G2.Position = "BN", "BN"
		team2G1.Position, team2G2.Position = "G", "G"
	} else {
		if teamGoalies.T1.LastName == team1G1Last {
			team1G1.Position, team1G2.Position = "G", "BN"
		} else if teamGoalies.T1.LastName == team1G2Last {
			team1G1.Position, team1G2.Position = "BN", "G"
		}
		if teamGoalies.T2.LastName == team2G1Last {
			team2G1.Position, team2G2.Position = "G", "BN"
		} else if teamGoalies.T2.LastName == team2G2Last {
			team2G1.Position, team2G2.Position = "BN", "G"
		}
	}
	requestBody.Roster.Players.Player = []AddPlayer{team2G1, team2G2, team1G1, team1G2}

	yahooURL := YahooFantasyAPIBaseURL + "/team/" + os.Getenv("YAHOO_LEAGUE_ID") + ".t." + os.Getenv("YAHOO_TEAM_ID") + "/roster"

	yc.sendXMLRequest(http.MethodPut, yahooURL, requestBody)
}

func (yc *YahooClient) addDrop(add string, drop string) {
	var requestBody AddDropPlayers
	requestBody.Transaction.Type = "add/drop"

	var addPlayer AddDropPlayer
	addPlayer.PlayerKey = add
	addPlayer.TransactionData.Type = "add"
	addPlayer.TransactionData.DestinationTeamKey = os.Getenv("YAHOO_LEAGUE_ID") + ".t." + os.Getenv("YAHOO_TEAM_ID")

	var dropPlayer AddDropPlayer
	dropPlayer.PlayerKey = drop
	dropPlayer.TransactionData.Type = "drop"
	dropPlayer.TransactionData.SourceTeamKey = os.Getenv("YAHOO_LEAGUE_ID") + ".t." + os.Getenv("YAHOO_TEAM_ID")

	requestBody.Transaction.Players.AddDropPlayer = []AddDropPlayer{addPlayer, dropPlayer}

	yahooURL := YahooFantasyAPIBaseURL + "/league/" + os.Getenv("YAHOO_LEAGUE_ID") + "/transactions"

	yc.sendXMLRequest(http.MethodPost, yahooURL, requestBody)
}

func (yc *YahooClient) sendXMLRequest(method string, url string, requestBody interface{}) ([]byte, error) {
	w := &bytes.Buffer{}
	w.Write([]byte(xml.Header))
	enc := xml.NewEncoder(w)
	if err := enc.Encode(requestBody); err != nil {
		return nil, err
	}

	client := http.Client{}
	req, err := http.NewRequest(method, url, w)
	if err != nil {
		return nil, err
	}
	req.Header = http.Header{
		"Authorization": {"Bearer " + yc.Auth.AccessToken},
		"Content-Type":  {"application/xml"},
	}
	log.Println(requestBody)
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	log.Println(string(body))

	return body, nil
}
