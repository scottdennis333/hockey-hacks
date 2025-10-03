import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import './App.css';
import TeamView from './TeamView';
import LeagueDraftResults from './LeagueDraftResults';
import ApiDebugInfo from './ApiDebugInfo';

function App() {
  const [currentView, setCurrentView] = useState('team');

  return (
    <div>
      {/* Navigation Bar */}
      <AppBar position="static" sx={{ backgroundColor: '#1e1e1e' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Hockey Fantasy App
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              color="inherit"
              onClick={() => setCurrentView('team')}
              sx={{
                backgroundColor: currentView === 'team' ? '#0288d1' : 'transparent',
                color: currentView === 'team' ? '#ffffff' : 'rgba(255,255,255,0.7)',
                borderRadius: '8px',
                border: currentView === 'team' ? '2px solid #01579b' : '2px solid transparent',
                fontWeight: currentView === 'team' ? 'bold' : 'normal',
                transform: currentView === 'team' ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: currentView === 'team' ? '#0277bd' : 'rgba(255,255,255,0.1)',
                  transform: 'scale(1.05)'
                }
              }}
            >
              Team View
            </Button>
            <Button
              color="inherit"
              onClick={() => setCurrentView('league-draft')}
              sx={{
                backgroundColor: currentView === 'league-draft' ? '#0288d1' : 'transparent',
                color: currentView === 'league-draft' ? '#ffffff' : 'rgba(255,255,255,0.7)',
                borderRadius: '8px',
                border: currentView === 'league-draft' ? '2px solid #01579b' : '2px solid transparent',
                fontWeight: currentView === 'league-draft' ? 'bold' : 'normal',
                transform: currentView === 'league-draft' ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: currentView === 'league-draft' ? '#0277bd' : 'rgba(255,255,255,0.1)',
                  transform: 'scale(1.05)'
                }
              }}
            >
              League Draft Results
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ p: 2 }}>
        {currentView === 'team' && <TeamView />}
        {currentView === 'league-draft' && <LeagueDraftResults />}
      </Box>

      {/* Debug Info */}
      <ApiDebugInfo />
    </div>
  );
}

export default App;
