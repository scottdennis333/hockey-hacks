import React, { useEffect, useState } from 'react';
import { Container, Select, MenuItem, FormControl, InputLabel, Typography, Box } from '@mui/material';
import { apiCall } from './api';

const leagueIds = { 2022: '419.l.6795', 2023: '427.l.4331', 2024: '453.l.4965', 2025: '465.l.15581' };

function LeagueDraftResults() {
  const [draftResults, setDraftResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedRound, setSelectedRound] = useState('all');
  const [availableRounds, setAvailableRounds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const [userTeam, setUserTeam] = useState(() => {
    // Load user's saved team from localStorage
    return localStorage.getItem('userTeam') || '';
  });

  const [isFirstTimeUser, setIsFirstTimeUser] = useState(() => {
    // Check if user has ever selected a team before
    return localStorage.getItem('userTeam') === null;
  });

  const fetchLeagueDraftResults = async () => {
    setLoading(true);
    try {
      const leagueId = leagueIds[selectedYear];

      // Fetch both draft results and teams
      const [draftData, teamsData] = await Promise.all([
        apiCall(`/league_draft_results/${leagueId}`),
        apiCall(`/teams/${leagueId}`)
      ]);

      console.log('🏒 LEAGUE DRAFT RESULTS RESPONSE:', JSON.stringify(draftData, null, 2));
      console.log('📊 Total league picks:', Array.isArray(draftData) ? draftData.length : 'Not an array');

      if (Array.isArray(draftData)) {
        setDraftResults(draftData);
        // Extract unique rounds for the dropdown
        const rounds = [...new Set(draftData.map(item => item.round))].sort((a, b) => a - b);
        setAvailableRounds(rounds);
        console.log('🎯 Available rounds:', rounds);
      } else {
        console.error('League draft results data is not an array:', draftData);
        setDraftResults([]);
        setAvailableRounds([]);
      }

      if (Array.isArray(teamsData)) {
        setTeams(teamsData);
      } else {
        console.error('Teams data is not an array:', teamsData);
        setTeams([]);
      }
    } catch (error) {
      console.error('Error fetching league draft results:', error);
      setDraftResults([]);
      setAvailableRounds([]);
      setTeams([]);
    }
    setLoading(false);
  };

  const filterResults = () => {
    if (selectedRound === 'all') {
      setFilteredResults(draftResults);
    } else {
      setFilteredResults(draftResults.filter(item => item.round === parseInt(selectedRound)));
    }
  };

  useEffect(() => {
    fetchLeagueDraftResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  useEffect(() => {
    filterResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftResults, selectedRound]);

  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
    setSelectedRound('all'); // Reset round when year changes
  };

  const handleRoundChange = (event) => {
    setSelectedRound(event.target.value);
  };

  const handleTeamChange = (event) => {
    const selectedTeam = event.target.value;
    setUserTeam(selectedTeam);

    // Save to localStorage so it persists across sessions
    localStorage.setItem('userTeam', selectedTeam);

    // Mark that user is no longer first-time user
    if (isFirstTimeUser && selectedTeam) {
      setIsFirstTimeUser(false);
      localStorage.setItem('hasSelectedTeam', 'true');
    }
  };

  // Group results by round for better display
  const groupedResults = {};
  filteredResults.forEach(item => {
    if (!groupedResults[item.round]) {
      groupedResults[item.round] = [];
    }
    groupedResults[item.round].push(item);
  });

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" component="h1" sx={{ mb: 3, color: '#ffffff' }}>
        League Draft Results
      </Typography>

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
            👋 Welcome! Please select your team from the "My Team" dropdown below to highlight your picks and get a personalized view.
          </Typography>
        </Box>
      )}

      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel id="year-select-label">Year</InputLabel>
          <Select
            labelId="year-select-label"
            value={selectedYear}
            label="Year"
            onChange={handleYearChange}
          >
            {Object.keys(leagueIds).map(year => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel id="round-select-label">Round</InputLabel>
          <Select
            labelId="round-select-label"
            value={selectedRound}
            label="Round"
            onChange={handleRoundChange}
          >
            <MenuItem value="all">All Rounds</MenuItem>
            {availableRounds.map(round => (
              <MenuItem key={round} value={round.toString()}>
                Round {round}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{
          minWidth: 200,
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
            My Team {isFirstTimeUser && '⭐'}
          </InputLabel>
          <Select
            labelId="team-select-label"
            value={userTeam}
            label="My Team"
            onChange={handleTeamChange}
          >
            <MenuItem value="">Select Your Team</MenuItem>
            {teams.map(team => (
              <MenuItem key={team.team_key} value={team.team_key}>
                {team.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Typography>Loading draft results...</Typography>
      ) : filteredResults.length === 0 ? (
        <Typography>No draft results available for the selected filters.</Typography>
      ) : (
        <div>
          {selectedRound === 'all' ? (
            // Show all rounds in table format
            (() => {
              // Get all rounds and teams
              const rounds = Object.keys(groupedResults).sort((a, b) => parseInt(a) - parseInt(b));

              // Get all unique teams and sort them by their draft order (first pick position)
              const allTeams = {};
              Object.values(groupedResults).flat().forEach(pick => {
                if (!allTeams[pick.team_key]) {
                  allTeams[pick.team_key] = {
                    name: pick.team_name,
                    key: pick.team_key,
                    firstPick: pick.pick
                  };
                } else if (pick.pick < allTeams[pick.team_key].firstPick) {
                  allTeams[pick.team_key].firstPick = pick.pick;
                }
              });

              const sortedTeams = Object.values(allTeams).sort((a, b) => a.firstPick - b.firstPick);

              // Create matrix: rounds x teams
              const createDraftMatrix = () => {
                const matrix = {};
                rounds.forEach(round => {
                  matrix[round] = {};
                  groupedResults[round].forEach(pick => {
                    matrix[round][pick.team_key] = pick;
                  });
                });
                return matrix;
              };

              const draftMatrix = createDraftMatrix();

              return (
                <Box sx={{ overflowX: 'auto', maxHeight: '80vh', overflowY: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    backgroundColor: '#1e1e1e',
                    border: '1px solid #555555'
                  }}>
                    {/* Header row with team names */}
                    <thead>
                      <tr>
                        <th style={{
                          padding: '12px 8px',
                          backgroundColor: '#2e2e2e',
                          color: '#ffffff',
                          border: '1px solid #555555',
                          fontWeight: 'bold',
                          fontSize: '0.9rem',
                          minWidth: '80px',
                          position: 'sticky',
                          top: 0,
                          zIndex: 10
                        }}>
                          Round
                        </th>
                        {sortedTeams.map(team => (
                          <th key={team.key} style={{
                            padding: '12px 4px',
                            backgroundColor: team.key === userTeam ? '#4caf50' : '#2e2e2e',
                            color: '#ffffff',
                            border: '1px solid #555555',
                            fontWeight: 'bold',
                            fontSize: '0.75rem',
                            minWidth: '100px',
                            maxWidth: '120px',
                            position: 'sticky',
                            top: 0,
                            zIndex: 10,
                            textAlign: 'center'
                          }}>
                            {team.name}
                            {team.key === userTeam && ' 👤'}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rounds.map(round => (
                        <tr key={round}>
                          <td style={{
                            padding: '8px',
                            backgroundColor: '#2e2e2e',
                            color: '#ffffff',
                            border: '1px solid #555555',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            position: 'sticky',
                            left: 0,
                            zIndex: 5
                          }}>
                            {round}
                          </td>
                          {sortedTeams.map(team => {
                            const pick = draftMatrix[round][team.key];
                            return (
                              <td key={team.key} style={{
                                padding: '6px 4px',
                                backgroundColor: pick && team.key === userTeam ? '#2d5a2d' : (pick ? '#1e1e1e' : '#0a0a0a'),
                                border: '1px solid #555555',
                                minWidth: '100px',
                                maxWidth: '120px',
                                fontSize: '0.75rem',
                                textAlign: 'center',
                                verticalAlign: 'top'
                              }}>
                                {pick ? (
                                  <div>
                                    <div style={{
                                      color: '#ffffff',
                                      fontWeight: 'bold',
                                      marginBottom: '2px',
                                      fontSize: '0.7rem'
                                    }}>
                                      #{pick.pick}
                                    </div>
                                    <div style={{
                                      color: '#2196f3',
                                      marginBottom: '2px',
                                      fontSize: '0.75rem',
                                      lineHeight: '1.1'
                                    }}>
                                      {pick.player || ' '}
                                    </div>
                                    <div style={{
                                      color: '#aaaaaa',
                                      fontSize: '0.65rem'
                                    }}>
                                      {pick.position || ''}
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{
                                    color: '#555555',
                                    fontStyle: 'italic'
                                  }}>
                                    -
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              );
            })()
          ) : (
            // Show specific round in table format
            (() => {
              // Sort picks by pick number for the selected round
              const sortedPicks = filteredResults.sort((a, b) => a.pick - b.pick);

              return (
                <Box>
                  <Typography variant="h5" sx={{ mb: 2, color: '#ffffff' }}>
                    Round {selectedRound}
                  </Typography>
                  <Box sx={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      backgroundColor: '#1e1e1e',
                      border: '1px solid #555555'
                    }}>
                      <thead>
                        <tr>
                          <th style={{
                            padding: '12px 8px',
                            backgroundColor: '#2e2e2e',
                            color: '#ffffff',
                            border: '1px solid #555555',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            textAlign: 'center'
                          }}>
                            Pick
                          </th>
                          <th style={{
                            padding: '12px 8px',
                            backgroundColor: '#2e2e2e',
                            color: '#ffffff',
                            border: '1px solid #555555',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            textAlign: 'center'
                          }}>
                            Team
                          </th>
                          <th style={{
                            padding: '12px 8px',
                            backgroundColor: '#2e2e2e',
                            color: '#ffffff',
                            border: '1px solid #555555',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            textAlign: 'center'
                          }}>
                            Player
                          </th>
                          <th style={{
                            padding: '12px 8px',
                            backgroundColor: '#2e2e2e',
                            color: '#ffffff',
                            border: '1px solid #555555',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            textAlign: 'center'
                          }}>
                            Position
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedPicks.map((item, index) => (
                          <tr key={index}>
                            <td style={{
                              padding: '18px 8px',
                              backgroundColor: '#1e1e1e',
                              color: '#ffffff',
                              border: '1px solid #555555',
                              fontWeight: 'bold',
                              textAlign: 'center',
                              fontSize: '0.85rem'
                            }}>
                              #{item.pick}
                            </td>
                            <td style={{
                              padding: '18px 8px',
                              backgroundColor: '#1e1e1e',
                              color: '#ffffff',
                              border: '1px solid #555555',
                              textAlign: 'center',
                              fontSize: '0.85rem'
                            }}>
                              {item.team_name || 'Unknown Team'}
                            </td>
                            <td style={{
                              padding: '18px 8px',
                              backgroundColor: '#1e1e1e',
                              color: '#2196f3',
                              border: '1px solid #555555',
                              fontWeight: 'bold',
                              textAlign: 'center',
                              fontSize: '0.85rem'
                            }}>
                              {item.player || ''}
                            </td>
                            <td style={{
                              padding: '18px 8px',
                              backgroundColor: '#1e1e1e',
                              color: '#aaaaaa',
                              border: '1px solid #555555',
                              textAlign: 'center',
                              fontSize: '0.85rem'
                            }}>
                              {item.position || ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                </Box>
              );
            })()
          )}
        </div>
      )}
    </Container>
  );
}

export default LeagueDraftResults;
