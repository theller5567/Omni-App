import React from 'react';
import { Box, Typography } from '@mui/material';

const Account: React.FC = () => {
  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h4">Account</Typography>
      <Typography variant="body1">Manage your account details here.</Typography>
    </Box>
  );
};

export default Account; 