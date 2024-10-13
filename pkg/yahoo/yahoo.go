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

type YahooClient struct {
	Auth YahooAuth
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

type AddDropPlayer struct {
	PlayerKey       string `xml:"player_key"`
	TransactionData struct {
		Type               string `xml:"type"`
		DestinationTeamKey string `xml:"destination_team_key,omitempty"`
		SourceTeamKey      string `xml:"source_team_key,omitempty"`
	} `xml:"transaction_data"`
}

type AddDropPlayers struct {
	XMLName     xml.Name `xml:"fantasy_content"`
	Transaction struct {
		Type    string `xml:"type"`
		Players struct {
			AddDropPlayer []AddDropPlayer `xml:"player"`
		} `xml:"players"`
	} `xml:"transaction"`
}

type YahooAuth struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
	TokenType    string `json:"token_type"`
}

type FantasyContent struct {
	XMLName        xml.Name `xml:"fantasy_content"`
	XMLLang        string   `xml:"xml:lang,attr"`
	YahooURI       string   `xml:"yahoo:uri,attr"`
	Time           string   `xml:"time,attr"`
	Copyright      string   `xml:"copyright,attr"`
	RefreshRate    string   `xml:"refresh_rate,attr"`
	YahooNamespace string   `xml:"xmlns:yahoo,attr"`
	Namespace      string   `xml:"xmlns,attr"`

	Team Team `xml:"team"`
}

type Team struct {
	TeamKey        string     `xml:"team_key"`
	TeamID         int        `xml:"team_id"`
	Name           string     `xml:"name"`
	IsOwnedByLogin int        `xml:"is_owned_by_current_login"`
	URL            string     `xml:"url"`
	TeamLogos      TeamLogos  `xml:"team_logos"`
	WaiverPriority int        `xml:"waiver_priority"`
	NumberOfMoves  int        `xml:"number_of_moves"`
	NumberOfTrades int        `xml:"number_of_trades"`
	RosterAdds     RosterAdds `xml:"roster_adds"`
	LeagueScoring  string     `xml:"league_scoring_type"`
	HasDraftGrade  int        `xml:"has_draft_grade"`
	Managers       Managers   `xml:"managers"`
	Roster         Roster     `xml:"roster"`
}

type TeamLogos struct {
	TeamLogo TeamLogo `xml:"team_logo"`
}

type TeamLogo struct {
	Size string `xml:"size"`
	URL  string `xml:"url"`
}

type RosterAdds struct {
	CoverageType  string `xml:"coverage_type"`
	CoverageValue int    `xml:"coverage_value"`
	Value         int    `xml:"value"`
}

type Managers struct {
	Manager Manager `xml:"manager"`
}

type Manager struct {
	ManagerID      int    `xml:"manager_id"`
	Nickname       string `xml:"nickname"`
	GUID           string `xml:"guid"`
	IsCurrentLogin int    `xml:"is_current_login"`
	Email          string `xml:"email"`
	ImageURL       string `xml:"image_url"`
	FeloScore      int    `xml:"felo_score"`
	FeloTier       string `xml:"felo_tier"`
}

type Roster struct {
	CoverageType string  `xml:"coverage_type"`
	Date         string  `xml:"date"`
	IsEditable   int     `xml:"is_editable"`
	Players      Players `xml:"players"`
}

type Players struct {
	PlayerList []Player `xml:"player"`
}

type Player struct {
	PlayerKey          string            `xml:"player_key"`
	PlayerID           int               `xml:"player_id"`
	Name               Name              `xml:"name"`
	URL                string            `xml:"url"`
	EditorialPlayerKey string            `xml:"editorial_player_key"`
	IsKeeper           IsKeeper          `xml:"is_keeper"`
	UniformNumber      int               `xml:"uniform_number"`
	DisplayPosition    string            `xml:"display_position"`
	Headshot           Headshot          `xml:"headshot"`
	ImageURL           string            `xml:"image_url"`
	IsUndroppable      int               `xml:"is_undroppable"`
	PositionType       string            `xml:"position_type"`
	PrimaryPosition    string            `xml:"primary_position"`
	EligiblePositions  EligiblePositions `xml:"eligible_positions"`
	SelectedPosition   SelectedPosition  `xml:"selected_position"`
	IsEditable         int               `xml:"is_editable"`
}

type Name struct {
	Full       string `xml:"full"`
	First      string `xml:"first"`
	Last       string `xml:"last"`
	AsciiFirst string `xml:"ascii_first"`
	AsciiLast  string `xml:"ascii_last"`
}

type IsKeeper struct {
	Status string `xml:"status"`
	Cost   string `xml:"cost"`
	Kept   string `xml:"kept"`
}

type Headshot struct {
	URL  string `xml:"url"`
	Size string `xml:"size"`
}

type EligiblePositions struct {
	Positions []string `xml:"position"`
}

type SelectedPosition struct {
	CoverageType string `xml:"coverage_type"`
	Date         string `xml:"date"`
	Position     string `xml:"position"`
	IsFlex       int    `xml:"is_flex"`
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
		log.Fatalln("Yahoo Auth Failed")
		os.Exit(1)
	}
}

func (yc *YahooClient) GetRosterPlayers() ([]Player, error) {
	url := "https://fantasysports.yahooapis.com/fantasy/v2/team/" + os.Getenv("YAHOO_LEAGUE_ID") + ".t." + os.Getenv("YAHOO_TEAM_ID") + "/roster/players"
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

	// Dallas Goalies
	oettingier := AddPlayer{PlayerKey: "nhl.p.7541"}
	desmith := AddPlayer{PlayerKey: "nhl.p.7429"}

	// St. Louis Goalies
	binnington := AddPlayer{PlayerKey: "nhl.p.5454"}
	hofer := AddPlayer{PlayerKey: "nhl.p.8004"}

	if teamGoalies.DAL == (goalies.Goalie{}) && teamGoalies.STL == (goalies.Goalie{}) {
		return
	}
	if teamGoalies.DAL == (goalies.Goalie{}) {
		binnington.Position, hofer.Position = "G", "G"
		oettingier.Position, desmith.Position = "BN", "BN"
	} else if teamGoalies.STL == (goalies.Goalie{}) {
		binnington.Position, hofer.Position = "BN", "BN"
		oettingier.Position, desmith.Position = "G", "G"
	} else {
		if teamGoalies.DAL.LastName == "Oettingier" {
			oettingier.Position, desmith.Position = "G", "BN"
		} else if teamGoalies.DAL.LastName == "Desmith" {
			oettingier.Position, desmith.Position = "BN", "G"
		}
		if teamGoalies.STL.LastName == "Binnington" {
			binnington.Position, hofer.Position = "BN", "G"
		} else if teamGoalies.STL.LastName == "Hofer" {
			binnington.Position, hofer.Position = "G", "BN"
		}
	}
	requestBody.Roster.Players.Player = []AddPlayer{binnington, hofer, oettingier, desmith}

	yahooURL := "https://fantasysports.yahooapis.com/fantasy/v2/team/" + os.Getenv("YAHOO_LEAGUE_ID") + ".t." + os.Getenv("YAHOO_TEAM_ID") + "/roster"

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

	yahooURL := "https://fantasysports.yahooapis.com/fantasy/v2/league/" + os.Getenv("YAHOO_LEAGUE_ID") + "/transactions"

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
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	// log.Println(string(body))

	return body, nil
}
