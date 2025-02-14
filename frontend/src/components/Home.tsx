import React from 'react';
import { Box, Typography } from '@mui/material';

const Home: React.FC = () => {
  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h4">Home</Typography>
      <Typography variant="body1">Welcome to the home page!</Typography>
    </Box>
  );
};

export default Home; 