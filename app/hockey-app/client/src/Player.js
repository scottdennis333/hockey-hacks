import * as React from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import { createTheme, ThemeProvider, styled } from '@mui/material/styles';
import { Typography } from '@mui/material';
import MyForm from './MyForm';

const Item = styled(Paper)(({ theme, index }) => ({
  ...theme.typography.body2,
  textAlign: 'center',
  color: theme.palette.text.secondary,
  height: 140,
  lineHeight: '140px',
  key: index,
}));

const darkTheme = createTheme({ palette: { mode: 'dark' } });
const lightTheme = createTheme({ palette: { mode: 'light' } });

function Player(props) {
  const pos = props?.player?.positions.filter(e => e !== 'UTIL');

  return (
    <ThemeProvider theme={darkTheme}>
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: 'background.default',
          display: 'grid',
          gap: 2,
          width: 'auto',
          height: 'auto',
        }}
      >
        <Item elevation={6} key={props.index}>
          {props.player && props.player.pick ? (
            <>
              <Typography variant="h6" color={'#083caa'} style={{paddingTop:'4px'}}>
              {props?.player?.name}
              {props?.player?.keeper && (
                <sup
                  style={{
                    border: '1px solid #083caa',
                    padding: '1px 3px',
                    borderRadius: '3px',
                    marginLeft: '5px',
                    fontSize: '80%',
                  }}
                >
                  K
                </sup>
              )}
            </Typography>
          <Typography variant="body1">{props?.player?.team}</Typography>
          <Typography variant="body1">{pos.join(', ')}</Typography>
          <Typography variant="body1">{'Round: ' + props?.player?.round}</Typography>
          <Typography variant="body1">{'Pick: ' + props?.player?.pick}</Typography>
        </>
        ) : (
        <MyForm />
          )}
      </Item>
    </Box>
    </ThemeProvider >
  );
}

export default Player;
