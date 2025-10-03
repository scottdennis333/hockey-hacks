import { Container, List, ListItem, ListItemText } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import React from 'react';

function DraftResults(props) {

  const { draftResults } = props;

  // Ensure draftResults is an array before using array methods
  const draftArray = Array.isArray(draftResults) ? draftResults : [];

  const halfIndex = Math.ceil(draftArray.length / 2);
  const firstHalf = draftArray.slice(0, halfIndex);
  const secondHalf = draftArray.slice(halfIndex);

  return (
    <Container maxWidth="sm">
      <h2 className="position" >Draft Results</h2>
      {draftArray.length === 0 ? (
        <p>No draft results available or there was an error loading the data.</p>
      ) : (
        <List>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              {firstHalf.map((item, index) => (
                <ListItem key={index} sx={{ borderBottom: '1px solid #555555', padding: '12px 0' }}>
                  <ListItemText primary={`${item.round}. ${item?.player || ''}`}
                    sx={{ color: '#ffffff', fontWeight: 'bold' }} />
                </ListItem>
              ))}
            </Grid>
            <Grid item xs={6}>
              <List style={{ paddingTop: '0px' }}>
                {secondHalf.map((item, index) => (
                  <ListItem key={index} sx={{ borderBottom: '1px solid #555555', padding: '12px 0' }}>
                    <ListItemText primary={`${item.round}. ${item?.player || ''}`} sx={{ color: '#ffffff' }} />
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        </List>
      )}
    </Container>
  );

}

export default DraftResults;

