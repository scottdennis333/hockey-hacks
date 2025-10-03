import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Card, CardContent, Chip } from '@mui/material';
import { apiCall } from './api';

function DraftPickTracker({ selectedLeagueId, selectedTeam }) {
  const [draftInfo, setDraftInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDraftInfo = async () => {
      setLoading(true);
      try {
        // Get league-wide draft results
        const leagueDraftData = await apiCall(`/league_draft_results/${selectedLeagueId}`);

        if (Array.isArray(leagueDraftData) && leagueDraftData.length > 0) {
          calculateDraftInfo(leagueDraftData);
        } else {
          setDraftInfo(null);
        }
      } catch (error) {
        console.error('Error fetching draft info:', error);
        setDraftInfo(null);
      }
      setLoading(false);
    };

    if (selectedLeagueId && selectedTeam) {
      fetchDraftInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLeagueId, selectedTeam]);

  const calculateDraftInfo = (draftData) => {
    // Sort by pick number
    const sortedPicks = draftData.sort((a, b) => a.pick - b.pick);

    // Find team's full key
    const fullTeamKey = `${selectedLeagueId}${selectedTeam}`;

    // Get team's picks that have players selected
    const teamPicks = sortedPicks.filter(pick => pick.team_key === fullTeamKey && pick.player_key);

    // Find the NEXT available pick (last pick made + 1)
    const picksWithPlayers = sortedPicks.filter(pick => pick.player_key);
    const lastPickMade = picksWithPlayers.length > 0 ? Math.max(...picksWithPlayers.map(pick => pick.pick)) : 0;
    const nextAvailablePick = lastPickMade + 1;

    // Find team pick numbers that have players selected
    const teamPickNumbers = teamPicks.map(pick => pick.pick);

    // Generate expected pick pattern based on existing picks
    const rounds = Math.max(...sortedPicks.map(pick => pick.round));
    const teamsCount = new Set(sortedPicks.map(pick => pick.team_key)).size;

    // Find team's position in draft order by looking at their first pick
    const teamFirstPick = teamPickNumbers.length > 0 ? Math.min(...teamPickNumbers) : null;
    let teamDraftPosition = null;

    if (teamFirstPick) {
      teamDraftPosition = ((teamFirstPick - 1) % teamsCount) + 1;
    } else {
      // If no picks made yet, find team's position from draft data structure
      const allTeamKeys = [...new Set(sortedPicks.map(pick => pick.team_key))];
      const teamIndex = allTeamKeys.indexOf(fullTeamKey);
      teamDraftPosition = teamIndex >= 0 ? teamIndex + 1 : 1;
    }

    // Find the team's next pick (that doesn't have a player yet)
    let nextTeamPick = null;
    let picksUntilTeamPick = 0;

    // Calculate next expected pick for this team that doesn't have a player
    for (let round = 1; round <= rounds + 5; round++) {
      let expectedPick;
      if (round % 2 === 1) {
        // Odd rounds: normal order
        expectedPick = (round - 1) * teamsCount + teamDraftPosition;
      } else {
        // Even rounds: reverse order
        expectedPick = (round - 1) * teamsCount + (teamsCount - teamDraftPosition + 1);
      }

      // Check if this pick belongs to our team and doesn't have a player yet
      const pickData = sortedPicks.find(pick => pick.pick === expectedPick);
      if (pickData && pickData.team_key === fullTeamKey && !pickData.player_key) {
        nextTeamPick = expectedPick;
        break;
      }
    }

    // Find who has the next available pick (first pick without a player)
    let nextPickHolder = 'Unknown Team';
    let nextPickTeamKey = '';
    let actualNextAvailablePick = nextAvailablePick;

    // Find the first pick that doesn't have a player selected
    for (const pick of sortedPicks) {
      if (!pick.player_key) {
        actualNextAvailablePick = pick.pick;
        nextPickHolder = pick.team_name;
        nextPickTeamKey = pick.team_key;
        break;
      }
    }

    // Calculate how many picks until team's next pick
    if (nextTeamPick) {
      // Count how many picks without players exist between now and team's next pick
      const picksInBetween = sortedPicks.filter(pick =>
        pick.pick >= actualNextAvailablePick &&
        pick.pick < nextTeamPick &&
        !pick.player_key
      );
      picksUntilTeamPick = picksInBetween.length;
    }

    // Calculate round and position for current pick
    const currentPickRound = Math.floor((actualNextAvailablePick - 1) / teamsCount) + 1;
    let currentPickPosition;
    if (currentPickRound % 2 === 1) {
      // Odd round: normal order
      currentPickPosition = ((actualNextAvailablePick - 1) % teamsCount) + 1;
    } else {
      // Even round: reverse order
      currentPickPosition = teamsCount - ((actualNextAvailablePick - 1) % teamsCount);
    }

    // Calculate round and position for team's next pick
    let nextTeamPickRound = null;
    let nextTeamPickPosition = null;
    if (nextTeamPick) {
      nextTeamPickRound = Math.floor((nextTeamPick - 1) / teamsCount) + 1;
      if (nextTeamPickRound % 2 === 1) {
        // Odd round: normal order
        nextTeamPickPosition = ((nextTeamPick - 1) % teamsCount) + 1;
      } else {
        // Even round: reverse order
        nextTeamPickPosition = teamsCount - ((nextTeamPick - 1) % teamsCount);
      }
    }

    // Check if draft is complete (no more picks without players)
    const picksWithoutPlayers = sortedPicks.filter(pick => !pick.player_key);
    const isDraftComplete = picksWithoutPlayers.length === 0;

    setDraftInfo({
      nextAvailablePick: actualNextAvailablePick,
      currentPickRound,
      currentPickPosition,
      nextPickHolder,
      isMyTeamNext: nextPickTeamKey === fullTeamKey,
      nextTeamPick,
      nextTeamPickRound,
      nextTeamPickPosition,
      picksUntilTeamPick,
      teamPickCount: teamPicks.length,
      totalPicks: sortedPicks.length,
      isDraftComplete
    });
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mb: 3 }}>
        <Typography>Loading draft information...</Typography>
      </Container>
    );
  }

  if (!draftInfo) {
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ mb: 3 }}>
      <Card sx={{ backgroundColor: '#1e1e1e', border: '1px solid #555555' }}>
        <CardContent>
          <Typography variant="h5" sx={{ color: '#ffffff', mb: 2 }}>
            🏒 Draft Pick Tracker
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <Box sx={{ minWidth: 200 }}>
              <Typography variant="body2" sx={{ color: '#bbbbbb' }}>
                Current Pick
              </Typography>
              <Typography variant="h4" sx={{ color: '#0288d1', fontWeight: 'bold' }}>
                #{draftInfo.nextAvailablePick}
              </Typography>
              <Typography variant="body2" sx={{ color: '#aaaaaa', fontSize: '0.875rem' }}>
                Round {draftInfo.currentPickRound}, Pick {draftInfo.currentPickPosition}
              </Typography>
              <Typography variant="body2" sx={{ color: '#ffffff' }}>
                {draftInfo.nextPickHolder}
              </Typography>
              {draftInfo.isMyTeamNext && (
                <Chip
                  label="YOUR TURN!"
                  sx={{
                    backgroundColor: '#4caf50',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    mt: 1
                  }}
                />
              )}
            </Box>

            {draftInfo.nextTeamPick && !draftInfo.isDraftComplete && (
              <Box sx={{ minWidth: 200 }}>
                <Typography variant="body2" sx={{ color: '#bbbbbb' }}>
                  Your Next Pick
                </Typography>
                <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                  #{draftInfo.nextTeamPick}
                </Typography>
                <Typography variant="body2" sx={{ color: '#aaaaaa', fontSize: '0.875rem' }}>
                  Round {draftInfo.nextTeamPickRound}, Pick {draftInfo.nextTeamPickPosition}
                </Typography>
                {draftInfo.isMyTeamNext ? (
                  <Chip
                    label="YOUR TURN!"
                    sx={{
                      backgroundColor: '#4caf50',
                      color: '#ffffff',
                      fontWeight: 'bold',
                      mt: 1
                    }}
                  />
                ) : (
                  <Chip
                    label={`${draftInfo.picksUntilTeamPick} picks away`}
                    sx={{
                      backgroundColor: draftInfo.picksUntilTeamPick <= 3 ? '#ff9800' : '#2196f3',
                      color: '#ffffff',
                      fontWeight: 'bold'
                    }}
                  />
                )}
              </Box>
            )}
          </Box>

          {draftInfo.isDraftComplete && (
            <Box sx={{ mt: 2 }}>
              <Chip
                label="Draft Complete"
                sx={{
                  backgroundColor: '#4caf50',
                  color: '#ffffff',
                  fontWeight: 'bold'
                }}
              />
            </Box>
          )}

          {draftInfo.isMyTeamNext && !draftInfo.isDraftComplete && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: '#4caf50', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                🎯 It's your turn to pick! Make your selection now.
              </Typography>
            </Box>
          )}

          {draftInfo.picksUntilTeamPick <= 3 && draftInfo.picksUntilTeamPick > 0 && !draftInfo.isMyTeamNext && (
            <Box sx={{ mt: 2, p: 2, backgroundColor: '#ff9800', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ color: '#000000', fontWeight: 'bold' }}>
                ⚠️ Your pick is coming up soon! ({draftInfo.picksUntilTeamPick} picks away)
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}

export default DraftPickTracker;
