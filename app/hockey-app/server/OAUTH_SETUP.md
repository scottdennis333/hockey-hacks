# Yahoo OAuth Setup Guide

This guide will help you set up proper Yahoo OAuth credentials for your Fantasy Sports app using environment variables.

## Prerequisites

1. **Yahoo Developer Account**: Sign up at [developer.yahoo.com](https://developer.yahoo.com)
2. **Yahoo Fantasy Account**: Must have access to fantasy leagues
3. **Node.js 18+**: For built-in fetch support

## Step-by-Step Process

### 1. Create Yahoo App

1. Go to [developer.yahoo.com/apps](https://developer.yahoo.com/apps/)
2. Click "Create an App"
3. Fill in the details:
   - **Application Name**: "Hockey Fantasy App" 
   - **Application Type**: "Web Application"
   - **Description**: "Fantasy hockey lineup optimizer"
   - **Home Page URL**: `http://localhost:5000`
   - **Redirect URI(s)**: `oob` (for out-of-band) or `http://localhost:3000/auth/yahoo/callback`
   - **API Permissions**: Check "Fantasy Sports" ✅

4. Submit and get your:
   - **Client ID** (Consumer Key)
   - **Client Secret** (Consumer Secret)

### 2. Configure Environment Variables

Update your `.env` file with your Yahoo App credentials:

```env
# Yahoo Fantasy API Credentials
YAHOO_CLIENT_ID=your_yahoo_client_id_here
YAHOO_CLIENT_SECRET=your_yahoo_client_secret_here
YAHOO_REFRESH_TOKEN=your_refresh_token_will_go_here
YAHOO_REDIRECT_URI=oob

# Yahoo API Endpoints (optional - has default)
YAHOO_TOKEN_ENDPOINT=https://api.login.yahoo.com/oauth2/get_token

# Server Configuration (optional - defaults to 5000)
PORT=5000
```

### 3. Run OAuth Flow

The OAuth scripts now automatically load credentials from your `.env` file:

```bash
# Step 1: Get authorization URL
cd /Users/admin/workspace/hockey-hacks/app/hockey-app/server
node oauth-setup.js

# Step 2: Visit the URL, authorize, get code
# (Copy the URL from the output and visit in your browser)

# Step 3: Exchange code for tokens
node oauth-exchange.js YOUR_AUTHORIZATION_CODE
```

### 4. Update .env File

The `oauth-exchange.js` script will output the new refresh token in `.env` format. Copy and paste the `YAHOO_REFRESH_TOKEN` line into your `.env` file:

```env
YAHOO_REFRESH_TOKEN=your_new_refresh_token_here
```

## Current Setup Status

✅ **Environment Variables**: All credentials are now stored in `.env` file  
✅ **OAuth Scripts**: Fixed and working with environment variables  
✅ **Built-in Fetch**: Using Node.js 18+ built-in fetch (no node-fetch dependency)  
✅ **Security**: Credentials are not hardcoded and `.env` is in `.gitignore`  

## Troubleshooting

- **"consumer_key_unknown"**: Your `YAHOO_CLIENT_ID` in `.env` is invalid
- **"invalid_client"**: Your `YAHOO_CLIENT_SECRET` in `.env` is wrong
- **"invalid_grant"**: Your `YAHOO_REFRESH_TOKEN` expired, repeat OAuth flow
- **"unauthorized_client"**: Your app doesn't have Fantasy Sports permission
- **"MODULE_NOT_FOUND"**: Make sure you're running Node.js 18+ for built-in fetch
- **Missing .env variables**: Check that all required variables are set in `.env`

## Test Your Setup

After updating your `.env` file, restart your server and check the logs for authentication errors:

```bash
npm start
```

Look for successful server startup message:
```
Server started at port 5000
```

If you see OAuth errors like `consumer_key_unknown`, your credentials need to be updated.

## Alternative: Try Backup Credentials

If you have valid backup credentials, you can use those from `backupCreds.js` by updating your `.env` file:

```env
YAHOO_CLIENT_ID=dj0yJmk9bnBnWXA5OUFhdUNXJmQ9WVdrOVUzWnphemhVVWtJbWNHbzlNQT09JnM9Y29uc3VtZXJzZWNyZXQmc3Y9MCZ4PTY4
YAHOO_CLIENT_SECRET=a80025811fcc0693e722859d7bf6f02320d1b90e
YAHOO_REFRESH_TOKEN=AOvrGGWdy0cs6Gpsf0Gukffn0eUb~000~6HqGObV0E8DEFqB8cddp9eia
```

## Environment Variable Setup

### Required Variables:
- `YAHOO_CLIENT_ID`: Your Yahoo App Consumer Key
- `YAHOO_CLIENT_SECRET`: Your Yahoo App Consumer Secret  
- `YAHOO_REFRESH_TOKEN`: Long-lived token for getting access tokens

### Optional Variables:
- `YAHOO_REDIRECT_URI`: Default is "oob" (out-of-band)
- `YAHOO_TOKEN_ENDPOINT`: Default is Yahoo's OAuth2 token endpoint
- `PORT`: Server port, default is 5000

## Quick Start

If you already have working credentials:

1. **Copy credentials to .env**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual credentials
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

3. **Check for authentication errors** in the server logs
