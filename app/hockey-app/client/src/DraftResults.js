import { Container, List, ListItem, ListItemText } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import React from 'react';

function DraftResults(props) {

  const { draftResults } = props;

  const halfIndex = Math.ceil(draftResults?.length / 2);
  const firstHalf = draftResults?.slice(0, halfIndex);
  const secondHalf = draftResults?.slice(halfIndex);

  return (
    <Container maxWidth="sm">
      <h2 className="position" >Draft Results</h2>
      <List>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            {firstHalf.map((item, index) => (
              <ListItem key={index} sx={{ borderBottom: '1px solid #ccc', padding: '12px 0' }}>
                <ListItemText primary={`${item.round}. ${item?.player || ''}`}
                  sx={{ color: '#333', fontWeight: 'bold' }} />
              </ListItem>
            ))}
          </Grid>
          <Grid item xs={6}>
            <List style={{ paddingTop: '0px' }}>
              {secondHalf.map((item, index) => (
                <ListItem key={index} sx={{ borderBottom: '1px solid #ccc', padding: '12px 0' }}>
                  <ListItemText primary={`${item.round}. ${item?.player || ''}`} />
                </ListItem>
              ))}
            </List>
          </Grid>
        </Grid>
      </List>
    </Container>
  );

}

export default DraftResults;

