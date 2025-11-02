// File: yahoo/models.go
package yahoo

import "encoding/xml"

type YahooAuth struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
	TokenType    string `json:"token_type"`
}

type SwapPlayer struct {
	PlayerKey string `xml:"player_key"`
	Position  string `xml:"position"`
}

type SwapPlayerRequest struct {
	XMLName xml.Name `xml:"fantasy_content"`
	Roster  struct {
		CoverageType string `xml:"coverage_type"`
		Date         string `xml:"date"`
		Players      struct {
			Player []SwapPlayer `xml:"player"`
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

type AddDropPlayerRequest struct {
	XMLName     xml.Name `xml:"fantasy_content"`
	Transaction struct {
		Type    string `xml:"type"`
		Players struct {
			AddDropPlayer []AddDropPlayer `xml:"player"`
		} `xml:"players"`
	} `xml:"transaction"`
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
    Status             string            `xml:"status"`
    TeamAbbr           string            `xml:"editorial_team_abbr"`
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

type OptimizedRoster struct {
	C    []Player
	LW   []Player
	RW   []Player
	D    []Player
	Util []Player
	BN   []Player
}
