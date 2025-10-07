package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

const (
	authURL    = "https://api.login.yahoo.com/oauth2/request_auth"
	tokenURL   = "https://api.login.yahoo.com/oauth2/get_token"
	stateValue = "random_state_123"
)

var (
	clientID     string
	clientSecret string
	ngrokDomain  string
	redirectURI  string
)

func main() {
	// Load environment variables from .env file
	err := godotenv.Load("../.env")
	if err != nil {
		log.Fatal("Error loading .env file:", err)
	}

	// Read environment variables after loading .env file
	clientID = os.Getenv("YAHOO_CLIENT_ID")
	clientSecret = os.Getenv("YAHOO_CLIENT_SECRET")
	ngrokDomain = os.Getenv("NGROK_DOMAIN")

	if clientID == "" || clientSecret == "" {
		log.Fatal("Please set YAHOO_CLIENT_ID and YAHOO_CLIENT_SECRET environment variables.")
	}

	if ngrokDomain == "" {
		log.Fatal("Please set NGROK_DOMAIN environment variable (e.g., abc123.ngrok.io)")
	}

	redirectURI = fmt.Sprintf("https://%s/callback", ngrokDomain)

	http.HandleFunc("/", startOAuthHandler)
	http.HandleFunc("/callback", callbackHandler)

	fmt.Println("✅ Server running on http://localhost:8080")
	fmt.Printf("👉 Open: https://%s\n", ngrokDomain)
	fmt.Printf("🔗 Redirect URI: %s\n", redirectURI)
	log.Fatal(http.ListenAndServe(":8080", nil))
}

// Step 1: Redirect user to Yahoo login
func startOAuthHandler(w http.ResponseWriter, r *http.Request) {
	params := url.Values{}
	params.Add("client_id", clientID)
	params.Add("redirect_uri", redirectURI)
	params.Add("response_type", "code")
	params.Add("state", stateValue)

	authRedirect := fmt.Sprintf("%s?%s", authURL, params.Encode())
	http.Redirect(w, r, authRedirect, http.StatusFound)
}

// Step 2: Handle Yahoo callback and exchange code for token
func callbackHandler(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	state := r.URL.Query().Get("state")

	if code == "" {
		http.Error(w, "Missing code", http.StatusBadRequest)
		return
	}
	if state != stateValue {
		http.Error(w, "Invalid state", http.StatusBadRequest)
		return
	}

	fmt.Println("✅ Received code:", code)

	// Exchange the code for a token
	data := url.Values{}
	data.Add("grant_type", "authorization_code")
	data.Add("code", code)
	data.Add("redirect_uri", redirectURI)

	req, err := http.NewRequest("POST", tokenURL, strings.NewReader(data.Encode()))
	if err != nil {
		fmt.Fprintf(w, "\n❌ Error building token request: %v", err)
		log.Fatal("Error building token request:", err)
	}

	authHeader := base64.StdEncoding.EncodeToString([]byte(clientID + ":" + clientSecret))
	req.Header.Set("Authorization", "Basic "+authHeader)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Fprintf(w, "\n❌ Token request failed: %v", err)
		log.Fatal("Token request failed:", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		fmt.Fprintf(w, "\n❌ Token exchange failed. Status: %d", resp.StatusCode)
		log.Fatalf("Token exchange failed. Status: %d\n", resp.StatusCode)
	}

	var tokenResp map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		fmt.Fprintf(w, "\n❌ Failed to parse token response: %v", err)
		log.Fatal("Failed to parse token response:", err)
	}

	fmt.Println("🎉 Token response:")
	tokenJSON, _ := json.MarshalIndent(tokenResp, "", "  ")
	fmt.Println(string(tokenJSON))

	if accessToken, ok := tokenResp["access_token"].(string); ok {
		// Get League ID
		leagueKey, err := getLeagueKey(accessToken)
		if err != nil {
			fmt.Fprintf(w, "\n❌ Error getting league key: %v", err)
		} else {
			// Get Team ID
			teamID, err := getTeamID(accessToken, leagueKey)
			if err != nil {
				fmt.Fprintf(w, "\n❌ Error getting team ID: %v", err)
			} else {
				fmt.Fprintln(w, "\n\n📝 Add these to your .env file:")
				fmt.Fprintf(w, "\nYAHOO_REFRESH_TOKEN=%s", tokenResp["refresh_token"])
				fmt.Fprintf(w, "\nYAHOO_LEAGUE_ID=%s", leagueKey)
				fmt.Fprintf(w, "\nYAHOO_TEAM_ID=%s", teamID)
			}
		}
	}

	fmt.Fprintln(w, "\n\n✅ You can now close this page and stop the server")
}

// getLeagueKey fetches the user's league key from Yahoo Fantasy API
func getLeagueKey(accessToken string) (string, error) {
	url := "https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nhl/leagues?format=json"

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var apiResp map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return "", err
	}

	// Navigate through the JSON structure to get league_key
	fantasyContent, ok := apiResp["fantasy_content"].(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("fantasy_content not found")
	}

	users, ok := fantasyContent["users"].(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("users not found")
	}

	user0, ok := users["0"].(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("user 0 not found")
	}

	userArray, ok := user0["user"].([]interface{})
	if !ok || len(userArray) < 2 {
		return "", fmt.Errorf("user array not found or insufficient length")
	}

	userGames, ok := userArray[1].(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("user games not found")
	}

	games, ok := userGames["games"].(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("games not found")
	}

	game0, ok := games["0"].(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("game 0 not found")
	}

	gameArray, ok := game0["game"].([]interface{})
	if !ok || len(gameArray) < 2 {
		return "", fmt.Errorf("game array not found or insufficient length")
	}

	gameLeagues, ok := gameArray[1].(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("game leagues not found")
	}

	leagues, ok := gameLeagues["leagues"].(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("leagues not found")
	}

	league0, ok := leagues["0"].(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("league 0 not found")
	}

	leagueArray, ok := league0["league"].([]interface{})
	if !ok || len(leagueArray) < 1 {
		return "", fmt.Errorf("league array not found or empty")
	}

	leagueData, ok := leagueArray[0].(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("league data not found")
	}

	leagueKey, ok := leagueData["league_key"].(string)
	if !ok {
		return "", fmt.Errorf("league_key not found")
	}

	return leagueKey, nil
}

// getTeamID fetches the user's team ID from Yahoo Fantasy API
func getTeamID(accessToken, leagueKey string) (string, error) {
	url := fmt.Sprintf("https://fantasysports.yahooapis.com/fantasy/v2/league/%s/teams?format=json", leagueKey)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var apiResp map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return "", err
	}

	// Navigate through the JSON structure to find the user's team
	fantasyContent, ok := apiResp["fantasy_content"].(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("fantasy_content not found")
	}

	league, ok := fantasyContent["league"].([]interface{})
	if !ok || len(league) < 2 {
		return "", fmt.Errorf("league not found")
	}

	leagueTeams, ok := league[1].(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("league teams not found")
	}

	teams, ok := leagueTeams["teams"].(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("teams not found")
	}

	// Look for the team that belongs to the current user
	for key, value := range teams {
		if key == "count" {
			continue
		}

		teamContainer, ok := value.(map[string]interface{})
		if !ok {
			continue
		}

		teamArray, ok := teamContainer["team"].([]interface{})
		if !ok || len(teamArray) < 1 {
			continue
		}

		// The team data is in a nested array structure
		teamNestedArray, ok := teamArray[0].([]interface{})
		if !ok {
			continue
		}

		var teamID string
		var isOwnedByCurrentUser bool

		// Iterate through the nested array to find team_id and is_owned_by_current_login
		for _, item := range teamNestedArray {
			itemMap, ok := item.(map[string]interface{})
			if !ok {
				continue
			}

			// Check for team_id
			if id, exists := itemMap["team_id"]; exists {
				if idStr, ok := id.(string); ok {
					teamID = idStr
				}
			}

			// Check for is_owned_by_current_login
			if owned, exists := itemMap["is_owned_by_current_login"]; exists {
				// Can be either number 1 or string "1"
				switch v := owned.(type) {
				case float64:
					isOwnedByCurrentUser = v == 1
				case string:
					isOwnedByCurrentUser = v == "1"
				case int:
					isOwnedByCurrentUser = v == 1
				}
			}
		}

		// If this is the user's team and we found the team ID, return it
		if isOwnedByCurrentUser && teamID != "" {
			return teamID, nil
		}
	}

	return "", fmt.Errorf("user's team not found")
}
