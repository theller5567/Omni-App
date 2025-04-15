import React from 'react';
import { Box, Container, Tabs, Tab, Paper } from '@mui/material';
import TypographyDemo from '../components/StyleGuide/TypographyDemo';
import { PageTitle } from '../theme/extendedComponents';

const StyleGuidePage: React.FC = () => {
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ pt: 4, pb: 8 }}>
      <Container maxWidth="lg">
        <PageTitle variant="h1">Omni Design System</PageTitle>
        
        <Paper sx={{ mb: 4 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Typography & Components" />
            <Tab label="Colors" disabled />
            <Tab label="Layouts" disabled />
            <Tab label="Forms" disabled />
          </Tabs>
        </Paper>

        {tabValue === 0 && <TypographyDemo />}
      </Container>
    </Box>
  );
};

export default StyleGuidePage; 