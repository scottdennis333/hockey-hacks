const express = require('express');
require('dotenv').config();

const app = express();
const YahooFantasy = require('yahoo-fantasy');

// CORS middleware - Allow requests from any origin
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  // Log incoming requests
  console.log(`📡 ${req.method} ${req.path} - Origin: ${req.get('Origin') || 'none'}`);

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Validate required environment variables
const requiredEnvVars = ['YAHOO_CLIENT_ID', 'YAHOO_CLIENT_SECRET', 'YAHOO_REFRESH_TOKEN'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please check your .env file');
  process.exit(1);
}

const clientId = process.env.YAHOO_CLIENT_ID;
const clientSecret = process.env.YAHOO_CLIENT_SECRET;
const refreshToken = process.env.YAHOO_REFRESH_TOKEN;
const tokenEndpoint = process.env.YAHOO_TOKEN_ENDPOINT || 'https://api.login.yahoo.com/oauth2/get_token';

const yahoo = new YahooFantasy({
  consumer_key: clientId,
  consumer_secret: clientSecret,
  redirect_uri: 'oob',
});

const tokenParams = {
  grant_type: 'refresh_token',
  client_id: clientId,
  client_secret: clientSecret,
  refresh_token: refreshToken,
};

let apiKey = null;

// Player data cache to avoid redundant API calls
const playerCache = new Map();
const teamLineupCache = new Map();
const CACHE_EXPIRY_MS = 5 * 60 * 60 * 1000; // 5 hours

// Rate limiting to prevent "Request denied" errors
let lastApiCall = 0;
const API_CALL_DELAY = 100; // 100ms between API calls

async function rateLimitedDelay() {
  const now = Date.now();
  const timeSinceLastCall = now - lastApiCall;
  if (timeSinceLastCall < API_CALL_DELAY) {
    const delayNeeded = API_CALL_DELAY - timeSinceLastCall;
    console.log(`⏱️ Rate limiting: waiting ${delayNeeded}ms`);
    await new Promise(resolve => setTimeout(resolve, delayNeeded));
  }
  lastApiCall = Date.now();
}

// Function to get cached player data or fetch if not cached
async function getCachedPlayerData(playerKey) {
  const now = Date.now();
  const cached = playerCache.get(playerKey);

  // Return cached data if it exists and hasn't expired
  if (cached && (now - cached.timestamp) < CACHE_EXPIRY_MS) {
    console.log(`💾 Using cached data for ${playerKey}: ${cached.data.name}`);
    return cached.data;
  }

  // Fetch new data
  try {
    await rateLimitedDelay(); // Add rate limiting
    const playerData = await yahoo.player.meta(playerKey);
    if (playerData) {
      const player = Array.isArray(playerData) ? playerData[0] : playerData;
      const processedData = {
        name: player.name?.full || 'Unknown Player',
        position: player.display_position || player.eligible_positions?.[0] || ''
      };

      // Cache the data with timestamp
      playerCache.set(playerKey, {
        data: processedData,
        timestamp: now
      });

      console.log(`🆕 Fetched and cached ${playerKey}: ${processedData.name} (${processedData.position})`);
      return processedData;
    }
  } catch (error) {
    console.error(`❌ Error fetching player data for ${playerKey}:`, error.message);

    // Log more details about JSON parsing errors
    if (error.message && error.message.includes('JSON')) {
      console.error(`🔍 JSON Parse Error Details for ${playerKey}:`, {
        error: error.message,
        stack: error.stack?.split('\n')[0] // Just first line of stack
      });

      // Check if this is a "Request denied" error
      if (error.message.includes('Unexpected token R') || error.message.includes('Request denied')) {
        console.log(`🚫 Request denied detected - likely auth issue. Refreshing token...`);
        try {
          await yahooRefreshAuth();
          console.log(`✅ Auth refreshed after request denied for ${playerKey}`);

          // Try the request one more time after auth refresh
          try {
            await rateLimitedDelay(); // Add rate limiting for retry
            const retryPlayerData = await yahoo.player.meta(playerKey);
            if (retryPlayerData) {
              const player = Array.isArray(retryPlayerData) ? retryPlayerData[0] : retryPlayerData;
              const processedData = {
                name: player.name?.full || 'Unknown Player',
                position: player.display_position || player.eligible_positions?.[0] || ''
              };

              playerCache.set(playerKey, {
                data: processedData,
                timestamp: Date.now()
              });

              console.log(`🆕 Retry successful for ${playerKey}: ${processedData.name}`);
              return processedData;
            }
          } catch (retryError) {
            console.error(`❌ Retry failed for ${playerKey}:`, retryError.message);
          }
        } catch (authError) {
          console.error(`❌ Failed to refresh auth:`, authError.message);
        }
      }

      // Try to refresh authentication if this looks like an auth issue
      if (error.message.includes('Unexpected end of JSON input')) {
        console.log(`🔄 JSON parse error detected - refreshing auth token...`);
        try {
          await yahooRefreshAuth();
          console.log(`✅ Auth refreshed, will use cached data for ${playerKey}`);
        } catch (authError) {
          console.error(`❌ Failed to refresh auth:`, authError.message);
        }
      }
    }    // Cache error result to avoid repeated failed requests
    const errorData = { name: 'Unknown Player', position: '' };
    playerCache.set(playerKey, {
      data: errorData,
      timestamp: now
    });
    return errorData;
  }

  return { name: 'Unknown Player', position: '' };
}

// Function to get cached team lineup data or fetch if not cached
async function getCachedTeamLineup(teamId) {
  const now = Date.now();
  const cached = teamLineupCache.get(teamId);

  // Return cached data if it exists and hasn't expired
  if (cached && (now - cached.timestamp) < CACHE_EXPIRY_MS) {
    console.log(`💾 Using cached lineup for ${teamId}`);
    return cached.data;
  }

  // Fetch new lineup data
  try {
    console.log(`🆕 Fetching fresh lineup for ${teamId}`);
    const players = await getPlayerData(teamId);
    const lineup = determineLineup(players, teamId);

    // Cache the lineup data with timestamp
    teamLineupCache.set(teamId, {
      data: lineup,
      timestamp: now
    });

    console.log(`✅ Cached lineup for ${teamId} (${Object.values(lineup).flat().filter(p => p !== null).length} players)`);
    return lineup;
  } catch (error) {
    console.error(`❌ Error fetching lineup for ${teamId}:`, error.message);
    throw error;
  }
}

async function yahooRefreshAuth() {
  try {
    console.log('🔄 Refreshing Yahoo authentication token...');
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'yahoo-fantasy-api',
      },
      body: new URLSearchParams(tokenParams),
    });

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('❌ Failed to parse auth response as JSON:', jsonError.message);
      const textResponse = await response.text();
      console.error('Raw response:', textResponse.substring(0, 200) + '...');
      throw new Error('Invalid JSON response from Yahoo auth endpoint');
    }

    if (response.ok && data.access_token) {
      console.log('✅ Successfully refreshed Yahoo token');
      yahoo.setUserToken(data.access_token);
      apiKey = data.access_token;
      return data.access_token;
    } else {
      console.error('❌ Failed to refresh Yahoo token:', data);
      throw new Error('Token refresh failed: ' + (data.error_description || data.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('❌ Error refreshing token:', error.message);
    throw error;
  }
}

// Initialize authentication on startup
let authInitialized = false;
async function initializeAuth() {
  if (!authInitialized) {
    try {
      await yahooRefreshAuth();
      authInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Yahoo authentication:', error.message);
    }
  }
}

const findIndexByValue = (arr, targetValue) => {
  t = arr.findIndex(item => Object.values(item).includes(targetValue));
  return t;
}

const getKeepers = async (leagueId) => {
  const pageSize = 25;
  const apiUrl = `https://fantasysports.yahooapis.com/fantasy/v2/league/${leagueId}/players;status=K?format=json`;

  const keeperKeys = [];

  try {
    await ensureAuthenticated();
    let start = 1;
    const totalPages = 2;

    for (let page = 1; page <= totalPages; page++) {
      const response = await fetch(`${apiUrl}&start=${start}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      const data = await response.json();

      if (data && data.fantasy_content && data.fantasy_content.league[1] && data.fantasy_content.league[1].players) {
        const playersObject = data.fantasy_content.league[1].players;
        for (const key in playersObject) {
          if (playersObject.hasOwnProperty(key) && key !== 'count') {
            const playerArray = playersObject[key].player;
            const playerKey = playerArray[0][0].player_key;

            keeperKeys.push(playerKey);
          }
        }
        start += pageSize;
      } else {
        console.error('Invalid response structure or missing property');
        return false;
      }
    }

    return keeperKeys;

  } catch (error) {
    console.error('Error:', error);
    return false;
  }
};


async function getDraftResultsWithPlayerData(teamId) {
  try {
    await ensureAuthenticated();

    const lastDotTIndex = teamId.lastIndexOf('.t');
    const leagueId = lastDotTIndex !== -1 ? teamId.substring(0, lastDotTIndex) : teamId;

    const draftResults = await yahoo.league.draft_results(leagueId);
    const teamDraftResults = draftResults.draft_results.filter(team => team.team_key === teamId);
    const players = teamDraftResults.map(player => player.player_key);

    for (const player of players) {
      if (player !== undefined) {
        const playerData = await yahoo.players.fetch(player);
        const index = findIndexByValue(teamDraftResults, player);
        teamDraftResults[index].player = playerData[0].name.full;
      }
    }

    return teamDraftResults;
  } catch (error) {
    console.error('Error getting draft results:', error);
    return error;
  }
}

async function getPlayerData(teamId) {
  try {
    await ensureAuthenticated();

    const position = teamId.indexOf(".t");
    const leagueId = teamId.substring(0, position);
    const results = await yahoo.team.draft_results(teamId);
    const players = results.draft_results.map(player => player.player_key);
    const filteredPlayers = players.filter(player => player !== undefined);
    const playerNames = await yahoo.players.fetch(filteredPlayers);
    const keepers = await getKeepers(leagueId);

    const playerData = playerNames.map(player => {
      const { name: { full }, eligible_positions, editorial_team_full_name, player_key } = player;
      data = { name: full, positions: eligible_positions, team: editorial_team_full_name };
      const index = findIndexByValue(results.draft_results, player_key)
      if (index >= 0) {
        data['pick'] = results.draft_results[index].pick;
        data['round'] = results.draft_results[index].round;
      }
      // Ensure keepers is an array before calling includes
      const keepersArray = Array.isArray(keepers) ? keepers : [];
      const isKeeper = keepersArray.includes(player_key);
      if (isKeeper) {
        data['keeper'] = true;
      }
      return data;
    });

    return playerData;
  } catch (error) {
    console.error(error);
    return error;
  }
}

const determineLineup = (players = [], year = '453.l.4965') => {
  let positions = { 'C': 2, 'LW': 2, 'RW': 2, 'D': 4, 'UTIL': 1, 'G': 2, 'BN': 4 };
  if (year.includes('453.l.4965') || year.includes('465.l.15581')) {
    positions = { 'C': 3, 'LW': 2, 'RW': 2, 'D': 3, 'UTIL': 1, 'G': 4, 'BN': 4 };
  }
  const lineup = { 'C': [], 'LW': [], 'RW': [], 'D': [], 'UTIL': [], 'G': [], 'BN': [] };

  // Sort players by the number of eligible positions (ascending order)
  if (!Array.isArray(players)) {
    return lineup;
  }
  players.sort((a, b) => a.positions.length - b.positions.length);

  // Ensure all players have 'UTIL' in their positions, except those with 'G' and 'D'
  players.forEach(player => {
    if (!player.positions.includes('UTIL') && !player.positions.includes('G') && !player.positions.includes('D')) {
      player.positions.push('UTIL');
    }
  });

  // Add empty elements to lineup object to match the positions object
  for (const pos in positions) {
    for (let i = lineup[pos].length; i < positions[pos]; i++) {
      lineup[pos].push(null);
    }
  }

  const findNextHighestPickPlayer = (currentPlayer) => {
    const playersInLineup = Object.entries(lineup).flatMap(([pos, players]) => players.map(player => ({ ...player, position: pos })));
    const samePositionPlayers = playersInLineup.filter(p =>
      p !== null &&
      p !== currentPlayer &&
      !p.keeper &&
      currentPlayer.positions.includes(p.position)
    );

    const nextHighestPickPlayer = samePositionPlayers.reduce((highest, p) => {
      if (!highest || p.pick > highest.pick) {
        return p;
      }
      return highest;
    }, null);

    return nextHighestPickPlayer;
  };


  const placePlayer = (player) => {
    let placed = false;


    // Check if the player has an eligible position that needs to be filled
    for (const pos of player.positions) {
      const index = lineup[pos].indexOf(null);
      if (index !== -1) {
        lineup[pos][index] = player;
        placed = true;
        break;
      }
    }

    // If the player still hasn't been placed, check for a player with a higher pick among players with the same positions
    if (!placed) {
      let highestPickPlayer = findNextHighestPickPlayer(player);

      if (highestPickPlayer && (player.keeper || player.pick < highestPickPlayer.pick)) {
        // Replace the player with the lower pick in the lineup
        const positionToReplace = Object.keys(lineup).find(pos => lineup[pos].some(player => player && player.name === highestPickPlayer.name));
        const indexToReplace = lineup[positionToReplace].findIndex(player => player && player.name === highestPickPlayer.name);
        lineup[positionToReplace][indexToReplace] = player;
        // Move the replaced player to the bench
        lineup['BN'].push(highestPickPlayer);
      } else {
        // If the player doesn't have a lower pick or no suitable replacement is found, add them to the bench
        lineup['BN'].push(player);
      }
    }
  };


  for (const player of players) {
    placePlayer(player);
  }

  // Check and remove null values from the lineup positions if their length exceeds the corresponding position value
  for (const pos in positions) {
    if (lineup[pos].length > positions[pos]) {
      lineup[pos] = lineup[pos].filter(player => player !== null).slice(0, positions[pos]);
    }
  }

  return lineup;
};

// Middleware to ensure authentication before API calls
async function ensureAuthenticated() {
  if (!apiKey || !authInitialized) {
    console.log('🔄 Authentication needed, refreshing token...');
    await initializeAuth();
  }
}

async function getTeams(leagueId) {
  try {
    await ensureAuthenticated();
    await rateLimitedDelay(); // Add rate limiting
    return await yahoo.league.teams(leagueId);
  } catch (error) {
    console.error('Error getting teams:', error);

    // Enhanced error handling for JSON parsing issues
    if (error.message && error.message.includes('JSON')) {
      console.error(`🔍 JSON Parse Error in getTeams for league ${leagueId}:`, {
        error: error.message,
        stack: error.stack?.split('\n')[0]
      });

      // Check if this is a "Request denied" error
      if (error.message.includes('Unexpected token R') || error.message.includes('Request denied')) {
        console.log('� Request denied detected in getTeams - refreshing auth...');
        try {
          await yahooRefreshAuth();
          console.log('✅ Auth refreshed, retrying teams request...');
          await rateLimitedDelay(); // Add delay before retry
          return await yahoo.league.teams(leagueId);
        } catch (authError) {
          console.error(`❌ Failed to refresh auth or retry:`, authError.message);
          return { error: 'Authentication failed', teams: [] };
        }
      }

      console.log('�🔄 JSON parse error detected - refreshing auth token...');
      try {
        await yahooRefreshAuth();
        console.log('✅ Auth refreshed, retrying teams request...');
        await rateLimitedDelay(); // Add delay before retry
        return await yahoo.league.teams(leagueId);
      } catch (authError) {
        console.error(`❌ Failed to refresh auth or retry:`, authError.message);
        return { error: 'Authentication failed', teams: [] };
      }
    }

    // Try to refresh token once if we get an auth error
    if (error.description && error.description.includes('cookie') || error.description && error.description.includes('Invalid')) {
      console.log('🔄 Retrying with fresh token...');
      try {
        await yahooRefreshAuth();
        return await yahoo.league.teams(leagueId);
      } catch (retryError) {
        console.error('❌ Retry failed:', retryError);
        return retryError;
      }
    }
    return error;
  }
}

// Root endpoint for basic connectivity testing
app.get('/', (req, res) => {
  res.json({
    status: 'Hockey Fantasy API Server Running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    authenticated: !!apiKey,
    authInitialized: authInitialized,
    endpoints: {
      teams: '/teams/:leagueId',
      teamLineup: '/api/:teamId/',
      leagueDraftResults: '/league_draft_results/:leagueId',
      teamDraftResults: '/draft_results/:teamId',
      cacheStats: '/cache-stats',
      authTest: '/auth-test'
    },
    sampleRequests: {
      teams: '/teams/465.l.15581',
      teamLineup: '/api/465.l.15581.t.12/',
      leagueDraftResults: '/league_draft_results/465.l.15581'
    }
  });
});

// Test endpoint to check authentication
app.get('/auth-test', async (req, res) => {
  try {
    console.log('🧪 Testing Yahoo API authentication...');
    await ensureAuthenticated();

    // Try a simple API call
    await rateLimitedDelay();
    const testResult = await yahoo.league.teams('465.l.15581');

    res.json({
      status: 'Authentication working',
      authenticated: true,
      teamsFound: testResult?.teams?.length || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Auth test failed:', error.message);
    res.status(500).json({
      status: 'Authentication failed',
      authenticated: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/teams/:leagueId', async (req, res) => {
  const teams = await getTeams(req.params.leagueId);
  res.send(teams.teams);
});

app.get('/api/:teamId/', async (req, res) => {
  try {
    const { teamId } = req.params;
    const lineup = await getCachedTeamLineup(teamId);
    res.send(lineup);
  } catch (error) {
    console.error(`Error fetching team lineup for ${teamId}:`, error);
    res.status(500).json({ error: 'Failed to fetch team lineup' });
  }
});

app.get('/league_draft_results/:leagueId', async (req, res) => {
  try {
    const leagueId = req.params.leagueId;
    console.log(`📊 Fetching league draft results for: ${leagueId}`);

    await ensureAuthenticated();

    // Get all draft results for the league
    let draftResults;
    try {
      draftResults = await yahoo.league.draft_results(leagueId);
    } catch (draftError) {
      console.error(`❌ Error fetching draft results for ${leagueId}:`, draftError.message);

      if (draftError.message && draftError.message.includes('JSON')) {
        console.error(`🔍 JSON Parse Error in draft results:`, {
          error: draftError.message,
          leagueId: leagueId
        });

        console.log('🔄 JSON parse error - refreshing auth and retrying...');
        try {
          await yahooRefreshAuth();
          draftResults = await yahoo.league.draft_results(leagueId);
          console.log('✅ Successfully fetched draft results after auth refresh');
        } catch (retryError) {
          console.error(`❌ Retry failed:`, retryError.message);
          return res.status(500).json({
            error: 'Failed to fetch draft results - JSON parsing error',
            details: 'Yahoo API returned invalid JSON response'
          });
        }
      } else {
        throw draftError; // Re-throw if not a JSON error
      }
    }

    if (!draftResults || !draftResults.draft_results) {
      console.log(`⚠️ No draft results found for league ${leagueId}`);
      return res.json([]);
    }

    // Get all unique player keys to batch fetch player data (filter out undefined/null)
    const playerKeys = [...new Set(draftResults.draft_results
      .map(pick => pick.player_key)
      .filter(key => key && key !== undefined && key !== null)
    )];

    console.log(`Found ${playerKeys.length} unique player keys to fetch`);

    // Batch fetch player data using cache
    const playersData = {};
    console.log(`🔍 Processing ${playerKeys.length} players (cache size: ${playerCache.size})`);

    for (const playerKey of playerKeys) {
      playersData[playerKey] = await getCachedPlayerData(playerKey);
    }

    // Get team names for better display
    let teams;
    try {
      teams = await yahoo.league.teams(leagueId);
    } catch (teamsError) {
      console.error(`❌ Error fetching teams for ${leagueId}:`, teamsError.message);
      teams = { teams: [] }; // Fallback to empty teams
    }

    const teamNames = {};
    if (teams && teams.teams) {
      teams.teams.forEach(team => {
        teamNames[team.team_key] = team.name;
      });
    }

    // Enhance draft results with player names and team names
    const enhancedResults = draftResults.draft_results.map(pick => ({
      ...pick,
      player: pick.player_key ? (playersData[pick.player_key]?.name || 'Unknown Player') : '',
      position: pick.player_key ? (playersData[pick.player_key]?.position || '') : '',
      team_name: teamNames[pick.team_key] || 'Unknown Team'
    }));

    console.log(`✅ Returning ${enhancedResults.length} draft picks`);

    // Log a sample of rounds for debugging
    const rounds = [...new Set(enhancedResults.map(pick => pick.round))].sort((a, b) => a - b);
    console.log(`Available rounds: [${rounds.join(', ')}]`);

    res.json(enhancedResults);
  } catch (error) {
    console.error('❌ Unexpected error fetching league draft results:', error);
    res.status(500).json({
      error: 'Failed to fetch league draft results',
      details: error.message
    });
  }
});

app.get('/draft_results/:teamId', async (req, res) => {
  const draftResult = await getDraftResultsWithPlayerData(req.params.teamId);
  res.send(draftResult);
});

// Cache statistics endpoint for debugging
app.get('/cache-stats', (req, res) => {
  const now = Date.now();
  const playerStats = {
    totalCached: playerCache.size,
    expired: 0,
    fresh: 0,
    sample: []
  };

  const teamStats = {
    totalCached: teamLineupCache.size,
    expired: 0,
    fresh: 0,
    sample: []
  };

  // Player cache stats
  playerCache.forEach((cached, playerKey) => {
    const age = now - cached.timestamp;
    if (age > CACHE_EXPIRY_MS) {
      playerStats.expired++;
    } else {
      playerStats.fresh++;
    }

    if (playerStats.sample.length < 5) {
      playerStats.sample.push({
        playerKey,
        name: cached.data.name,
        position: cached.data.position,
        ageMinutes: Math.round(age / 1000 / 60)
      });
    }
  });

  // Team lineup cache stats
  teamLineupCache.forEach((cached, teamId) => {
    const age = now - cached.timestamp;
    if (age > CACHE_EXPIRY_MS) {
      teamStats.expired++;
    } else {
      teamStats.fresh++;
    }

    if (teamStats.sample.length < 3) {
      const playerCount = Object.values(cached.data).flat().filter(p => p !== null).length;
      teamStats.sample.push({
        teamId,
        playerCount,
        ageMinutes: Math.round(age / 1000 / 60)
      });
    }
  });

  res.json({
    players: playerStats,
    teamLineups: teamStats,
    cacheExpiryHours: CACHE_EXPIRY_MS / (60 * 60 * 1000)
  });
});

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  let playersCleaned = 0;
  let teamsCleaned = 0;

  // Clean expired player cache entries
  playerCache.forEach((cached, playerKey) => {
    if ((now - cached.timestamp) > CACHE_EXPIRY_MS) {
      playerCache.delete(playerKey);
      playersCleaned++;
    }
  });

  // Clean expired team lineup cache entries
  teamLineupCache.forEach((cached, teamId) => {
    if ((now - cached.timestamp) > CACHE_EXPIRY_MS) {
      teamLineupCache.delete(teamId);
      teamsCleaned++;
    }
  });

  if (playersCleaned > 0 || teamsCleaned > 0) {
    console.log(`🧹 Cleaned ${playersCleaned} players, ${teamsCleaned} team lineups. Cache sizes: ${playerCache.size} players, ${teamLineupCache.size} teams`);
  }
}, 10 * 60 * 1000); // Clean every 10 minutes

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0'; // Allow connections from any IP

app.listen(PORT, HOST, async () => {
  console.log(`Server started at http://${HOST}:${PORT}`);
  console.log('Local access: http://localhost:' + PORT);

  // Show local network IP for other devices
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  const localIP = Object.values(networkInterfaces)
    .flat()
    .find(interface => interface.family === 'IPv4' && !interface.internal)?.address;

  if (localIP) {
    console.log(`Network access: http://${localIP}:${PORT}`);
    console.log('Other devices can access at the network URL above');
  }

  // Initialize Yahoo authentication
  console.log('🔐 Initializing Yahoo authentication...');
  await initializeAuth();
});

