import React, { useEffect, useState } from 'react';
import Forwards from './Forwards';
import Defensemen from './Defensemen';
import Goalies from './Goalies';
import './App.css';
import Grid from '@mui/material/Unstable_Grid2';
import Bench from './Bench';
import Util from './Util';
import DraftResults from './DraftResults';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

const leagueIds = { 2022: '419.l.6795', 2023: '427.l.4331', 2024: '453.l.4965'};

function App() {
  const [players, setPlayers] = useState([]);
  const [draftResults, setDraftResults] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [loadingDraftResults, setLoadingDraftResults] = useState(true);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [selectedLeagueId, setSelectedLeagueId] = useState(leagueIds[2024]);
  const [selectedTeam, setSelectedTeam] = useState(`.t.12`);


  useEffect(() => {
    fetchTeams();
    fetchPlayerData();
    fetchDraftResults();
  }, [selectedTeam, selectedLeagueId]);

  const fetchTeams = () => {
    const cachedData = localStorage.getItem(`teams_${selectedLeagueId}`);

    if (false) {
      console.log('Data retrieved from localStorage');
      const parsedData = JSON.parse(cachedData);
      setTeams(parsedData);
      setLoadingTeams(false);
      return;
    }

    fetch(`/teams/${selectedLeagueId}`)
      .then(res => res.json())
      .then(data => {
        // Store the data in localStorage
        localStorage.setItem(`teams_${selectedLeagueId}`, JSON.stringify(data));

        setTeams(data);
        setLoadingTeams(false);
      })
      .catch(error => {
        console.error('Error fetching teams:', error);
        setLoadingTeams(false);
      });
  };


  const fetchPlayerData = () => {
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

    fetch(`/api/${selectedLeagueId}${selectedTeam}`)
      .then(res => res.json())
      .then(data => {
        localStorage.setItem(`playerData_${selectedLeagueId}${selectedTeam}`, JSON.stringify(data));
        setPlayers(data);
        setLoadingPlayers(false);
      })
      .catch(error => {
        console.error('Error fetching player data:', error);
        setPlayers([]);
        setLoadingPlayers(false);
      });
  };



  const fetchDraftResults = () => {
    const cachedData = localStorage.getItem(`draftResults_${selectedLeagueId}${selectedTeam}`);

    if (false) {
      console.log('Draft results retrieved from localStorage');
      const parsedData = JSON.parse(cachedData);
      setDraftResults(parsedData);
      setLoadingDraftResults(false);
      return;
    }

    fetch(`/draft_results/${selectedLeagueId}${selectedTeam}`)
      .then(res => res.json())
      .then(data => {
        localStorage.setItem(`draftResults_${selectedLeagueId}${selectedTeam}`, JSON.stringify(data));
        setDraftResults(data);
        setLoadingDraftResults(false);
      })
      .catch(error => {
        console.error('Error fetching draft results:', error);
        setLoadingDraftResults(false);
      });
  };

  const handleTeamChange = event => {
    const position = event.target.value.indexOf('.t');
    const result = event.target.value.slice(position);
    console.log('result:', result);
    setSelectedTeam(result);
  };

  const handleLeagueChange = event => {
    setSelectedLeagueId(event.target.value);
  };

  return (
    <>
      {loadingTeams || loadingPlayers || loadingDraftResults ? (
        <div>Loading ...</div>
      ) : (
        <>
          <label htmlFor="teamDropdown">Select a Team: </label>
          <Select
            label="Team"
            id="teamDropdown"
            value={`${selectedLeagueId}${selectedTeam}`}
            onChange={handleTeamChange}
            sx={{ width: 200 }}
          >
            {teams.map(team => (
              <MenuItem key={team.team_id} value={team.team_key}>
                {team.managers[0].nickname} - {team.name}
              </MenuItem>
            ))}
          </Select>

          <label style={{ marginLeft: '10px' }} htmlFor="leagueDropdown">Select a Year: </label>
          <Select
            label="League"
            id="leagueDropdown"
            value={selectedLeagueId}
            onChange={handleLeagueChange}
            sx={{ width: 200, marginBottom: '10px' }}
          >
            {Object.entries(leagueIds).map(([key, value]) => (
              <MenuItem key={value} value={value}>
                {key}
              </MenuItem>
            ))}
          </Select>
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

export default App;
