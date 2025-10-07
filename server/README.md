# Yahoo OAuth2 Server

A simple Go web server that handles the Yahoo Fantasy Sports OAuth2 authentication flow to obtain refresh tokens for the Hockey Hacks application.

## Purpose

This server automates the OAuth2 flow to get a Yahoo refresh token, which is required for the main Hockey Hacks application to access Yahoo Fantasy Sports APIs. Yahoo requires the redirect uri to use `https`, so we use ngrok to create a secure tunnel.

## How It Works

1. **Start Server**: Runs a local web server on port 8080
2. **Initiate OAuth**: User visits the server URL and gets redirected to Yahoo login
3. **User Authorization**: User logs into Yahoo and authorizes the application
4. **Token Exchange**: Server receives the authorization code and exchanges it for tokens
5. **Display Results**: Refresh token is displayed in the terminal for you to copy

## Prerequisites

- Go 1.19 or higher
- ngrok (for creating a public tunnel to your local server)
- Yahoo Developer App configured with proper redirect URI
- `.env` file in the parent directory with Yahoo credentials

## Setup

### 1. Install ngrok

```bash
# macOS (using Homebrew)
brew install ngrok

# Or download from https://ngrok.com/download
```

### 2. Start ngrok tunnel

```bash
ngrok http 8080
```

This will give you a public URL like `https://abc123.ngrok.io`

### 3. Update Environment Variables

Add your ngrok domain to the `.env` file in the parent directory:

```bash
# Add this line to your .env file
NGROK_DOMAIN=abc123.ngrok.io
```

Replace `abc123.ngrok.io` with your actual ngrok domain (without the `https://` prefix).

### 4. Update Yahoo App Settings

1. Go to your [Yahoo Developer App](https://developer.yahoo.com/apps/)
2. Edit your app settings
3. Update the **Redirect URI** to: `https://YOUR-NGROK-DOMAIN/callback`
   - Use the same domain you set in your `NGROK_DOMAIN` environment variable

## Usage

### 1. Start the Server

From the `server/` directory:

```bash
go run main.go
```

You should see:
```
✅ Server running on http://localhost:8080
👉 Open: abc123.ngrok.io
🔗 Redirect URI: https://abc123.ngrok.io/callback
```

### 2. Complete OAuth Flow

1. Open the ngrok URL in your browser (e.g., `https://abc123.ngrok.io`)
2. You'll be redirected to Yahoo login
3. Log in with your Yahoo account
4. Authorize the Hockey Hacks application
5. You'll be redirected back to the server

### 3. Copy the .env Variables

The server will output something like:

```
📝 Add these to your .env file:

YAHOO_REFRESH_TOKEN=ANNX5Wh5vsCDRbL8T5lzjNx7pNNg~001~vpBrPDGnJXvke8VRxNkvNEef
YAHOO_LEAGUE_ID=465.l.1234
YAHOO_TEAM_ID=8

✅ You can now close this page and stop the server (Ctrl+C)
```

Copy the values and update your `.env` file

