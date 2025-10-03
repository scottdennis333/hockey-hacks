const express = require('express');
const crypto = require('crypto');
require('dotenv').config();

// Load credentials from environment variables
const CLIENT_ID = process.env.YAHOO_CLIENT_ID;
const CLIENT_SECRET = process.env.YAHOO_CLIENT_SECRET;
const REDIRECT_URI = process.env.YAHOO_REDIRECT_URI || "oob";

// Validate required environment variables
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing required environment variables: YAHOO_CLIENT_ID and/or YAHOO_CLIENT_SECRET');
  console.error('Please add them to your .env file');
  process.exit(1);
}

const app = express();

// Step 1: Generate Authorization URL manually
console.log('\n=== YAHOO OAUTH SETUP ===\n');
console.log('Step 1: Get Authorization URL');
console.log('Visit this URL in your browser:\n');

// Generate a random state parameter for security (optional but recommended)
const state = crypto.randomBytes(16).toString('hex');

// Create the Yahoo OAuth authorization URL
const authUrl = `https://api.login.yahoo.com/oauth2/request_auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&language=en-us&state=${state}`;
console.log(authUrl);

console.log(`\n🔒 State parameter: ${state} (keep this for validation if needed)`)

console.log('\n=== INSTRUCTIONS ===');
console.log('1. Copy the URL above and paste it in your browser');
console.log('2. Log in to your Yahoo account');
console.log('3. Authorize your app');
console.log('4. Copy the authorization code from the URL or page');
console.log('5. Run: node oauth-exchange.js YOUR_AUTH_CODE');

// Optional: Set up callback endpoint if using redirect URI
if (REDIRECT_URI !== 'oob') {
  app.get('/auth/yahoo/callback', (req, res) => {
    const authCode = req.query.code;
    console.log('\nAuthorization code received:', authCode);
    res.send(`
      <h2>Authorization Code Received!</h2>
      <p><strong>Code:</strong> ${authCode}</p>
      <p>Now run: <code>node oauth-exchange.js ${authCode}</code></p>
    `);
  });

  app.listen(3000, () => {
    console.log('\nCallback server running on http://localhost:3000');
    console.log('Waiting for OAuth callback...\n');
  });
}
