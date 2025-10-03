import Grid from '@mui/material/Unstable_Grid2';
import Player from './Player';

function Forwards(props) {

  const { centers = [] } = props;
  const { leftwings = [] } = props;
  const { rightwings = [] } = props;

  console.log('Forwards data:', { centers, leftwings, rightwings });

  return (
    <Grid container spacing={2}>
      <Grid xs={4} direction={'column'} container spacing={1}>
        <h2 className="position" style={{ textAlign: "center" }}>Left Wing</h2>
        {leftwings.map((player, index) => {
          return (
            <Player key={`lw-${index}`} player={player} index={index} />
          )
        })}
      </Grid>
      <Grid xs={4} direction={'column'} container spacing={2}>
        <h2 className="position" style={{ textAlign: "center" }}>Center</h2>
        {centers.map((player, index) => {
          return (
            <Player key={`c-${index}`} player={player} />
          )
        })}
      </Grid>
      <Grid xs={4} direction={'column'} container spacing={2}>
        <h2 className="position" style={{ textAlign: "center" }}>Right Wing</h2>
        {rightwings.map((player, index) => {
          return (
            <Player key={`rw-${index}`} player={player} />
          )
        })}
      </Grid>
    </Grid >
  );
}

export default Forwards;

