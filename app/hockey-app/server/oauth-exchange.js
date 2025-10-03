// Use built-in fetch (Node.js 18+) or require node-fetch
const fetch = globalThis.fetch || require('node-fetch');
require('dotenv').config();

// Get the authorization code from command line arguments
const authCode = process.argv[2];

if (!authCode) {
  console.error('Please provide the authorization code as an argument');
  console.error('Usage: node oauth-exchange.js YOUR_AUTH_CODE');
  process.exit(1);
}

// Load credentials from environment variables
const CLIENT_ID = process.env.YAHOO_CLIENT_ID;
const CLIENT_SECRET = process.env.YAHOO_CLIENT_SECRET;
const REDIRECT_URI = process.env.YAHOO_REDIRECT_URI || "oob"; // Must match your app settings

// Validate required environment variables
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing required environment variables: YAHOO_CLIENT_ID and/or YAHOO_CLIENT_SECRET');
  console.error('Please check your .env file');
  process.exit(1);
}

async function exchangeCodeForTokens() {
  console.log('Exchanging authorization code for tokens...\n');

  const tokenEndpoint = process.env.YAHOO_TOKEN_ENDPOINT || 'https://api.login.yahoo.com/oauth2/get_token';

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    code: authCode,
  });

  try {
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'hockey-app/1.0',
      },
      body: params,
    });

    const data = await response.json();

    if (response.ok) {
      console.log('SUCCESS! Here are your tokens:\n');
      console.log('=== ADD THESE TO YOUR .env FILE ===');
      console.log(`YAHOO_CLIENT_ID=${CLIENT_ID}`);
      console.log(`YAHOO_CLIENT_SECRET=${CLIENT_SECRET}`);
      console.log(`YAHOO_REFRESH_TOKEN=${data.refresh_token}`);
      console.log('\n=== TOKEN DETAILS ===');
      console.log('Access Token:', data.access_token);
      console.log('Refresh Token:', data.refresh_token);
      console.log('Expires In:', data.expires_in, 'seconds');
      console.log('Token Type:', data.token_type);

      // Test the access token
      await testAccessToken(data.access_token);

    } else {
      console.error('Error exchanging code for tokens:');
      console.error('Status:', response.status);
      console.error('Response:', data);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function testAccessToken(accessToken) {
  console.log('\n=== TESTING ACCESS TOKEN ===');

  try {
    const testUrl = 'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games?format=json';
    const testResponse = await fetch(testUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'hockey-app/1.0',
      },
    });

    const testData = await testResponse.json();

    if (testResponse.ok) {
      console.log('✅ Access token is working!');
      console.log('Available games:', testData.fantasy_content?.users[0]?.user[1]?.games?.count || 'Unable to parse');
    } else {
      console.log('❌ Access token test failed:');
      console.log('Status:', testResponse.status);
      console.log('Response:', testData);
    }
  } catch (error) {
    console.log('❌ Error testing access token:', error.message);
  }
}

exchangeCodeForTokens();
