import React, { useState } from 'react';
import { TextField, Button, Container, Typography } from '@mui/material';

const MyForm = ({ onSubmit, onCancel }) => {
  const [inputValue1, setInputValue1] = useState('');
  const [inputValue2, setInputValue2] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ text1: inputValue1, text2: inputValue2 });
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        height: '50px',
        display: 'flex',
        flexDirection: 'column',
        margin: '9px',
        gap: '4px', // Added gap between elements
      }}
    >
      <TextField
        label="Name"
        variant="outlined"
        fullWidth
        margin="none"
        size="small"
        value={inputValue1}
        onChange={(e) => setInputValue1(e.target.value)}
      />
      <TextField
        label="Position"
        variant="outlined"
        fullWidth
        margin="none"
        size="small"
        value={inputValue2}
        onChange={(e) => setInputValue2(e.target.value)}
        style={{ marginTop: '4px' }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="submit" variant="contained" color="primary" style={{ marginLeft: '4px' }}>
          Submit
        </Button>
        <Button onClick={handleCancel} variant="outlined" color="error" style={{ marginLeft: '4px' }}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

function App() {
  const [editing, setEditing] = useState(false);
  const [submittedText, setSubmittedText] = useState(null);

  const handleEditClick = () => {
    setEditing(true);
  };

  const handleFormSubmit = ({ text1, text2 }) => {
    setSubmittedText({ text1, text2 });
    setEditing(false);
  };

  const handleFormCancel = () => {
    setEditing(false);
  };

  return (
    <Container maxWidth="xs" style={{ maxHeight: '130px' }}>
      {!editing ? (
        <>
          <Typography variant="h6" color={'#083caa'}>
            {submittedText && submittedText.text1}
          </Typography>
          <Typography variant="body1">
            {submittedText && submittedText.text2}
          </Typography>
          {!submittedText && (
            <Button onClick={handleEditClick} variant="outlined" color="primary">
              Edit
            </Button>
          )}
        </>
      ) : (
        <MyForm onSubmit={handleFormSubmit} onCancel={handleFormCancel} />
      )}
    </Container>
  );
}

export default App;
