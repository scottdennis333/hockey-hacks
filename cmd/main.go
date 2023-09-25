package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"encoding/xml"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"net/smtp"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/joho/godotenv"
	"golang.org/x/oauth2/endpoints"
)

type Goalie struct {
	PlayerID  int    `json:"PlayerID"`
	TeamID    int    `json:"TeamID"`
	Team      string `json:"Team"`
	FirstName string `json:"FirstName"`
	LastName  string `json:"LastName"`
	Confirmed bool   `json:"Confirmed"`
}

type StartingGoalie struct {
	COL  Goalie `json:"col"`
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

type YahooAuth struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
	TokenType    string `json:"token_type"`
}

type AddPlayer struct {
	PlayerKey string `xml:"player_key"`
	Position  string `xml:"position"`
}

type AddPlayers struct {
	XMLName xml.Name `xml:"fantasy_content"`
	Roster  struct {
		CoverageType string `xml:"coverage_type"`
		Date         string `xml:"date"`
		Players      struct {
			Player []AddPlayer `xml:"player"`
		} `xml:"players"`
	} `xml:"roster"`
}

var yahooAuth YahooAuth

func main() {
	godotenv.Load("../.env")

	f, err := os.OpenFile("../mylog.log", os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
	if err != nil {
		log.Fatalln(err)
	}
	defer f.Close()

	log.SetOutput(f)

	log.Println("Starting Program")

	var wg sync.WaitGroup
	wg.Add(2)
	go yahooRefreshAuth(&wg)
	startingGoalies := getStartingGoalies(&wg)
	wg.Wait()

	yahooSwapPlayers(startingGoalies)

	log.Printf("Ending Program\n")
}

func yahooRefreshAuth(wg *sync.WaitGroup) {
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
		json.Unmarshal([]byte(body), &yahooAuth)
	} else {
		sendEmail(body)
		log.Fatalln("Yahoo Auth Failed")
	}
}

func getStartingGoalies(wg *sync.WaitGroup) StartingGoalie {
	defer wg.Done()

	date := time.Now().Format("2006-01-02")
	client := http.Client{}
	sportsDataUrl := "https://api.sportsdata.io/v3/nhl/projections/json/StartingGoaltendersByDate/" + date
	req, err := http.NewRequest("GET", sportsDataUrl, nil)
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
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Fatalln(err)
	}

	var games []Game
	if resp.StatusCode == 200 {
		json.Unmarshal([]byte(body), &games)
	} else {
		sendEmail(body)
		log.Fatalln("Failed to get starting goalies")
	}

	return determineStaringGoalies(games)
}

func determineStaringGoalies(games []Game) StartingGoalie {
	var startingGoalies StartingGoalie
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

func yahooSwapPlayers(startingGoalies StartingGoalie) {
	var requestBody AddPlayers
	requestBody.Roster.CoverageType = "date"
	requestBody.Roster.Date = time.Now().Format("2006-01-02")

	ag := AddPlayer{PlayerKey: "419.p.7736"}
	pf := AddPlayer{PlayerKey: "419.p.7874"}
	vh := AddPlayer{PlayerKey: "419.p.6462"}
	jr := AddPlayer{PlayerKey: "419.p.4369"}

	if (startingGoalies.COL == Goalie{} && startingGoalies.DET == Goalie{}) {
		return
	}
	if (startingGoalies.DET == Goalie{}) {
		ag.Position = "G"
		pf.Position = "G"
		vh.Position = "BN"
		jr.Position = "BN"
	} else if (startingGoalies.COL == Goalie{}) {
		ag.Position = "BN"
		pf.Position = "BN"
		vh.Position = "G"
		jr.Position = "G"
	} else {
		if startingGoalies.COL.LastName == "Georgiev" {
			ag.Position = "G"
			pf.Position = "BN"
		} else {
			ag.Position = "BN"
			pf.Position = "G"
		if startingGoalies.DET.LastName == "Husso" {
			vh.Position = "G"
			jr.Position = "BN"
		} else {
			vh.Position = "BN"
			jr.Position = "G"
		}
	}
	requestBody.Roster.Players.Player = []AddPlayer{ag, pf, vh, jr}

	log.Println(requestBody)

	w := &bytes.Buffer{}
	w.Write([]byte(xml.Header))
	enc := xml.NewEncoder(w)
	if err := enc.Encode(requestBody); err != nil {
		log.Fatal(err)
	}

	client := http.Client{}
	yahooUrl := "https://fantasysports.yahooapis.com/fantasy/v2/team/419.l.6795.t." + os.Getenv("YAHOO_TEAM_ID") + "/roster"
	req, err := http.NewRequest("PUT", yahooUrl, w)
	if err != nil {
		log.Fatalln(err)
	}
	req.Header = http.Header{
		"Authorization": {"Bearer " + yahooAuth.AccessToken},
		"Content-Type":  {"application/xml"},
	}
	resp, err := client.Do(req)
	if err != nil {
		log.Fatalln(err)
	}
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Fatalln(err)
	}

	if resp.StatusCode >= 400 {
		sendEmail(body)
		log.Fatalln("Failed to switch starting goalies")
		log.Fatalln(requestBody)
	}

	log.Println(string(body))
}

func sendEmail(respBody []byte) {
	from := os.Getenv("EMAIL_ADDRESS")
	password := os.Getenv("EMAIL_PASSWORD")

	toEmailAddress := os.Getenv("EMAIL_ADDRESS")
	to := []string{toEmailAddress}

	host := "smtp.gmail.com"
	port := "587"
	address := host + ":" + port

	subject := "Subject: Yahoo Refresh Token Failure\n"
	body := "YAHOO REFRESH TOKEN FAILURE\n\n\nResponse:\n" + string(respBody)
	message := []byte(subject + body)

	auth := smtp.PlainAuth("", from, password, host)

	err := smtp.SendMail(address, auth, from, to, message)
	if err != nil {
		panic(err)
	}
}
