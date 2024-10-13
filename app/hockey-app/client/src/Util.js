import Grid from '@mui/material/Unstable_Grid2';
import React from 'react';
import Player from './Player';

function Util(props) {

  const { util } = props;

  return (
    <Grid xs={4} direction={'column'} container spacing={1}>
      <h2 className="position" style={{ textAlign: "center" }}>Util</h2>
      {util.map((player, index) => {
        return (
          <Player key={`util-${index}`} player={player} index={index} />
        )
      })}
    </Grid>
  );
}

export default Util;

