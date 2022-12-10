package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"encoding/xml"
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
	NJ  Goalie `json:"nj"`
	BOS Goalie `json:"bos"`
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

var staringGoalies StartingGoalie
var yahooAuth YahooAuth
var games []Game
var wg sync.WaitGroup

var LU = AddPlayer{PlayerKey: "419.p.5853"}
var JS = AddPlayer{PlayerKey: "419.p.7626"}
var VN = AddPlayer{PlayerKey: "419.p.6408"}
var AS = AddPlayer{PlayerKey: "419.p.8033"}

var requestBody AddPlayers

func main() {
	godotenv.Load("../.env")

	f, err := os.OpenFile("../mylog.log", os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
	if err != nil {
		log.Fatalln("error opening file: %v", err)
	}
	defer f.Close()

	log.SetOutput(f)

	log.Println("Starting Program")

	wg.Add(1)
	go yahooRefreshAuth()
	wg.Add(1)
	go startingGoalies()
	wg.Wait()

	yahooSwapPlayers()
}

func yahooRefreshAuth() {
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

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.Fatalln(err)
	}
	if resp.StatusCode == 200 {
		json.Unmarshal([]byte(body), &yahooAuth)
	} else {
		sendEmail(body)
	}
}

func startingGoalies() {
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

	json.Unmarshal([]byte(body), &games)

	determineStaringGoalies()
}

func determineStaringGoalies() {
	for _, n := range games {
		switch n.HomeTeam {
		case "BOS":
			staringGoalies.BOS = n.HomeGoaltender
			break
		case "NJ":
			staringGoalies.NJ = n.HomeGoaltender
			break
		}
		switch n.AwayTeam {
		case "BOS":
			staringGoalies.BOS = n.AwayGoaltender
			break
		case "NJ":
			staringGoalies.NJ = n.AwayGoaltender
			break
		}
	}
	log.Println(staringGoalies)
}

func yahooSwapPlayers() {
	requestBody.Roster.CoverageType = "date"
	requestBody.Roster.Date = time.Now().Format("2006-01-02")

	if (staringGoalies.NJ == Goalie{} && staringGoalies.BOS == Goalie{}) {
		return
	}
	if (staringGoalies.NJ == Goalie{}) {
		LU.Position = "G"
		JS.Position = "G"
		VN.Position = "BN"
		AS.Position = "BN"
	} else if (staringGoalies.BOS == Goalie{}) {
		LU.Position = "BN"
		JS.Position = "BN"
		VN.Position = "G"
		AS.Position = "G"
	} else {
		if staringGoalies.NJ.LastName == "Vanecek" {
			VN.Position = "G"
			AS.Position = "BN"
		} else {
			VN.Position = "BN"
			AS.Position = "G"
		}
		if staringGoalies.BOS.LastName == "Ullmark" {
			LU.Position = "BN"
			JS.Position = "G"
		} else {
			LU.Position = "BN"
			JS.Position = "G"
		}
	}
	requestBody.Roster.Players.Player = []AddPlayer{LU, JS, VN, AS}

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
	log.Println(string(body))
	log.Println("Ending Program\n")
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
