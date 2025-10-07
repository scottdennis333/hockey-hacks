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
	fmt.Fprintln(w, "Got the code! Exchanging for token... (check terminal)")

	// Exchange the code for a token
	data := url.Values{}
	data.Add("grant_type", "authorization_code")
	data.Add("code", code)
	data.Add("redirect_uri", redirectURI)

	req, err := http.NewRequest("POST", tokenURL, strings.NewReader(data.Encode()))
	if err != nil {
		log.Fatal("Error building token request:", err)
	}

	authHeader := base64.StdEncoding.EncodeToString([]byte(clientID + ":" + clientSecret))
	req.Header.Set("Authorization", "Basic "+authHeader)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Fatal("Token request failed:", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Fatalf("Token exchange failed. Status: %d\n", resp.StatusCode)
	}

	var tokenResp map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		log.Fatal("Failed to parse token response:", err)
	}

	fmt.Println("🎉 Token response:")
	tokenJSON, _ := json.MarshalIndent(tokenResp, "", "  ")
	fmt.Println(string(tokenJSON))
}
