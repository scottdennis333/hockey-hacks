import React, { useEffect, useState } from 'react';
import Forwards from './Forwards';
import Defensemen from './Defensemen';
import Goalies from './Goalies';
import Grid from '@mui/material/Unstable_Grid2';
import Bench from './Bench';
import Util from './Util';
import DraftResults from './DraftResults';
import DraftPickTracker from './DraftPickTracker';
import { Select, MenuItem, FormControl, InputLabel, Typography, Box } from '@mui/material';
import { apiCall } from './api';

const leagueIds = { 2022: '419.l.6795', 2023: '427.l.4331', 2024: '453.l.4965', 2025: '465.l.15581' };

function TeamView() {
  const [players, setPlayers] = useState({
    C: [],
    LW: [],
    RW: [],
    D: [],
    UTIL: [],
    G: [],
    BN: []
  });
  const [draftResults, setDraftResults] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [loadingDraftResults, setLoadingDraftResults] = useState(true);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [selectedLeagueId, setSelectedLeagueId] = useState(leagueIds[2025]);
  const [selectedTeam, setSelectedTeam] = useState(() => {
    // Load user's saved team from localStorage, or default to .t.12
    const savedTeam = localStorage.getItem('userTeam');
    if (savedTeam) {
      const position = savedTeam.indexOf('.t');
      return position !== -1 ? savedTeam.slice(position) : '.t.12';
    }
    return '.t.12';
  });
  const [userTeam, setUserTeam] = useState(() => {
    // Load user's saved team from localStorage
    return localStorage.getItem('userTeam') || '';
  });
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(() => {
    // Check if user has ever selected a team before
    return localStorage.getItem('userTeam') === null;
  });

  const fetchTeams = async () => {
    const cachedData = localStorage.getItem(`teams_${selectedLeagueId}`);

    if (false) {
      console.log('Data retrieved from localStorage');
      const parsedData = JSON.parse(cachedData);
      setTeams(parsedData);
      setLoadingTeams(false);
      return;
    }

    try {
      const data = await apiCall(`/teams/${selectedLeagueId}`);
      localStorage.setItem(`teams_${selectedLeagueId}`, JSON.stringify(data));
      setTeams(data);
      setLoadingTeams(false);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setLoadingTeams(false);
    }
  };

  const fetchPlayerData = async () => {
    if (!selectedTeam) {
      return;
    }

    const cachedData = localStorage.getItem(`playerData_${selectedLeagueId}${selectedTeam}`);

    if (false) {
      console.log('Player data retrieved from localStorage');
      const parsedData = JSON.parse(cachedData);
      setPlayers(parsedData);
      setLoadingPlayers(false);
      return;
    }

    setLoadingPlayers(true);

    try {
      const data = await apiCall(`/api/${selectedLeagueId}${selectedTeam}`);
      localStorage.setItem(`playerData_${selectedLeagueId}${selectedTeam}`, JSON.stringify(data));
      setPlayers(data);
      setLoadingPlayers(false);
    } catch (error) {
      console.error('Error fetching player data:', error);
      setPlayers({
        C: [],
        LW: [],
        RW: [],
        D: [],
        UTIL: [],
        G: [],
        BN: []
      });
      setLoadingPlayers(false);
    }
  };

  const fetchDraftResults = async () => {
    const cachedData = localStorage.getItem(`draftResults_${selectedLeagueId}${selectedTeam}`);

    if (false) {
      console.log('Draft results retrieved from localStorage');
      const parsedData = JSON.parse(cachedData);
      setDraftResults(parsedData);
      setLoadingDraftResults(false);
      return;
    }

    try {
      const data = await apiCall(`/draft_results/${selectedLeagueId}${selectedTeam}`);

      console.log('🏒 TEAM DRAFT RESULTS RESPONSE:', JSON.stringify(data, null, 2));
      console.log('📊 Number of picks:', Array.isArray(data) ? data.length : 'Not an array');

      if (Array.isArray(data)) {
        localStorage.setItem(`draftResults_${selectedLeagueId}${selectedTeam}`, JSON.stringify(data));
        setDraftResults(data);
      } else {
        console.error('Draft results data is not an array:', data);
        setDraftResults([]);
      }
      setLoadingDraftResults(false);
    } catch (error) {
      console.error('Error fetching draft results:', error);
      setDraftResults([]);
      setLoadingDraftResults(false);
    }
  };

  useEffect(() => {
    fetchTeams();
    fetchPlayerData();
    fetchDraftResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeam, selectedLeagueId]);

  // Sync selected team when teams are loaded and ensure user's saved team is applied
  useEffect(() => {
    if (teams.length > 0 && userTeam) {
      // Find if the user's saved team exists in the current league
      const matchingTeam = teams.find(team => team.team_key === userTeam);
      if (matchingTeam) {
        const position = userTeam.indexOf('.t');
        if (position !== -1) {
          const teamSuffix = userTeam.slice(position);
          if (teamSuffix !== selectedTeam) {
            setSelectedTeam(teamSuffix);
          }
        }
      }
    }
  }, [teams, userTeam, selectedTeam]);

  const handleTeamChange = event => {
    const fullTeamKey = event.target.value;
    const position = fullTeamKey.indexOf('.t');
    const result = fullTeamKey.slice(position);
    console.log('result:', result);
    setSelectedTeam(result);

    // Also update userTeam state and localStorage
    setUserTeam(fullTeamKey);
    localStorage.setItem('userTeam', fullTeamKey);

    // Mark that user is no longer first-time user
    if (isFirstTimeUser && fullTeamKey) {
      setIsFirstTimeUser(false);
      localStorage.setItem('hasSelectedTeam', 'true');
    }
  };

  const handleLeagueChange = event => {
    const newLeagueId = event.target.value;
    setSelectedLeagueId(newLeagueId);

    // Update selectedTeam to match user's saved team for the new league
    const savedTeam = localStorage.getItem('userTeam');
    if (savedTeam) {
      const position = savedTeam.indexOf('.t');
      if (position !== -1) {
        const teamSuffix = savedTeam.slice(position);
        setSelectedTeam(teamSuffix);
      }
    }
  };

  return (
    <>
      {loadingTeams || loadingPlayers || loadingDraftResults ? (
        <div>Loading ...</div>
      ) : (
        <>
          {/* Welcome message for first-time users */}
          {isFirstTimeUser && (
            <Box sx={{
              mb: 3,
              p: 2,
              backgroundColor: '#2196f3',
              borderRadius: 1,
              border: '1px solid #1976d2'
            }}>
              <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                👋 Welcome! Please select your team from the "Select a Team" dropdown below to view your lineup and get a personalized experience.
              </Typography>
            </Box>
          )}

          <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl sx={{
              minWidth: 250,
              '& .MuiOutlinedInput-root': isFirstTimeUser ? {
                '& fieldset': { borderColor: '#2196f3', borderWidth: '2px' },
                '&:hover fieldset': { borderColor: '#1976d2', borderWidth: '2px' },
                '&.Mui-focused fieldset': { borderColor: '#0d47a1', borderWidth: '2px' }
              } : {}
            }}>
              <InputLabel
                id="team-select-label"
                sx={isFirstTimeUser ? { color: '#2196f3', fontWeight: 'bold' } : {}}
              >
                Select a Team {isFirstTimeUser && '⭐'}
              </InputLabel>
              <Select
                labelId="team-select-label"
                label="Select a Team"
                value={`${selectedLeagueId}${selectedTeam}`}
                onChange={handleTeamChange}
              >
                {teams.map(team => (
                  <MenuItem key={team.team_id} value={team.team_key}>
                    {team.managers[0].nickname} - {team.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel id="year-select-label">Year</InputLabel>
              <Select
                labelId="year-select-label"
                label="Year"
                value={selectedLeagueId}
                onChange={handleLeagueChange}
              >
                {Object.entries(leagueIds).map(([key, value]) => (
                  <MenuItem key={value} value={value}>
                    {key}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <DraftPickTracker
            selectedLeagueId={selectedLeagueId}
            selectedTeam={selectedTeam}
          />

          <Forwards centers={players.C} leftwings={players.LW} rightwings={players.RW} />
          <Grid container spacing={2}>
            <Defensemen defensemen={players.D} />
            <Util util={players.UTIL} />
            <Bench bench={players.BN} />
          </Grid>
          <Grid container spacing={2}>
            <Goalies goalies={players.G} />
            <DraftResults draftResults={draftResults} />
          </Grid>
        </>
      )}
    </>
  );
}

export default TeamView;
