const express = require('express');

const app = express();
const YahooFantasy = require('yahoo-fantasy');

const clientId = "dj0yJmk9bnBnWXA5OUFhdUNXJmQ9WVdrOVUzWnphemhVVWtJbWNHbzlNQT09JnM9Y29uc3VtZXJzZWNyZXQmc3Y9MCZ4PTY4";
const clientSecret = "a80025811fcc0693e722859d7bf6f02320d1b90e";
const refreshToken = 'AOvrGGWdy0cs6Gpsf0Gukffn0eUb~000~6HqGObV0E8DEFqB8cddp9eia';
const tokenEndpoint = 'https://api.login.yahoo.com/oauth2/get_token';

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

function yahooRefreshAuth() {
  fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'yahoo-fantasy-api',
    },
    body: new URLSearchParams(tokenParams),
  })
    .then(response => response.json())
    .then(data => {
      yahoo.setUserToken(data.access_token);
      apiKey = data.access_token;
    })
    .catch(error => {
      console.error('Error refreshing token:', error);
    });
}

yahoo.setUserToken(yahooRefreshAuth());

const findIndexByValue = (arr, targetValue) => {
  t = arr.findIndex(item => Object.values(item).includes(targetValue));
  return t;
}

const getKeepers = async (leagueId) => {
  const pageSize = 25;
  const apiUrl = `https://fantasysports.yahooapis.com/fantasy/v2/league/${leagueId}/players;status=K?format=json`;

  const keeperKeys = [];

  try {
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
    console.error(error);
    return error;
  }
}

async function getPlayerData(teamId) {
  try {
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
      const isKeeper = keepers.includes(player_key);
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
  if (year.includes('453.l.4965')) {
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

async function getTeams(leagueId) {
  try {
    return await yahoo.league.teams(leagueId);
  } catch (error) {
    console.error(error);
    return error;
  }
}

app.get('/teams/:leagueId', async (req, res) => {
  const teams = await getTeams(req.params.leagueId);
  res.send(teams.teams);
});

app.get('/api/:teamId/', async (req, res) => {
  const { teamId } = req.params;
  const players = await getPlayerData(teamId);
  const lineup = determineLineup(players, teamId);
  res.send(lineup);
});

app.get('/draft_results/:teamId', async (req, res) => {
  const draftResult = await getDraftResultsWithPlayerData(req.params.teamId);
  res.send(draftResult);
});

app.listen(5000, () => {
  console.log('Server started at port 5000');
});

