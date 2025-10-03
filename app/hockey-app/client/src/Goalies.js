import React from 'react';
import Grid from '@mui/material/Unstable_Grid2';
import Player from './Player';


function Goalies(props) {
  const { goalies = [] } = props;

  return (
    <Grid xs={4} direction={'column'} container spacing={1}>
      <h2 className="position" style={{ textAlign: "center" }}>Goalies</h2>
      {goalies.map((player, index) => {
        return (
          <Player key={`g-${index}`} player={player} index={index} />
        )
      })}
    </Grid>
  );
}

export default Goalies;

