// frontend/src/pages/NotFoundPage.tsx
import React from 'react';
import { Box, Button, Typography, Container } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';

const NotFoundPage: React.FC = () => {
  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          textAlign: 'center',
          py: 4,
        }}
      >
        <ReportProblemIcon sx={{ fontSize: 80, color: 'warning.main', mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom>
          404 - Page Not Found
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Sorry, the page you are looking for does not exist. It might have been moved or deleted.
        </Typography>
        <Button
          component={RouterLink}
          to="/media-library"
          variant="contained"
          size="large"
          sx={{ mt: 4 }}
        >
          Go to Media Library
        </Button>
      </Box>
    </Container>
  );
};

export default NotFoundPage;
