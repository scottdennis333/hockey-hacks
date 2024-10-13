import Grid from '@mui/material/Unstable_Grid2';
import React from 'react';
import Player from './Player';

function Defensemen(props) {

  const { defensemen } = props;

  return (
    <Grid xs={4} direction={'column'} container spacing={1}>
      <h2 className="position" style={{ textAlign: "center" }}>Defensemen</h2>
      {defensemen.map((player, index) => {
        return (
          <Player key={`d-${index}`} player={player} index={index} />
        )
      })}
    </Grid>
  );
}

export default Defensemen;

