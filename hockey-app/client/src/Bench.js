import Grid from '@mui/material/Unstable_Grid2';
import React from 'react';
import Player from './Player';

function Bench(props) {

  const { bench } = props;

  return (
    <Grid xs={4} direction={'column'} container spacing={1}>
      <h2 className="position" style={{ textAlign: "center" }}>Bench</h2>
      {bench.map((player, index) => {
        return (
          <Player player={player} index={index} />
        )
      })}
    </Grid>
  );
}

export default Bench;

