import React from 'react';
import { Box, Container, Divider, Grid, Paper } from '@mui/material';
import { DisplayHeading, PageTitle, SectionHeading, LeadText, TruncatedText, GradientText } from '../../theme/extendedComponents';
import { HoverCard, StatusChip, GradientBox } from '../../theme/extendedComponents';

const TypographyDemo: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <DisplayHeading variant="h1">Typography & Components</DisplayHeading>
      <LeadText>
        This page demonstrates the custom typography and component styles available in the application.
        These components extend Material UI and provide consistent styling across the app.
      </LeadText>
      
      <Divider sx={{ my: 4 }} />
      
      <PageTitle variant="h2">Typography Examples</PageTitle>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <SectionHeading variant="h3">Headings</SectionHeading>
            
            <Box sx={{ mb: 4 }}>
              <DisplayHeading variant="h1">Display Heading</DisplayHeading>
              <Box sx={{ color: 'text.secondary', mb: 2 }}>
                Used for hero sections and main page headlines
              </Box>
              
              <PageTitle variant="h2">Page Title</PageTitle>
              <Box sx={{ color: 'text.secondary', mb: 2 }}>
                Used for main page titles with a divider
              </Box>
              
              <SectionHeading variant="h3">Section Heading</SectionHeading>
              <Box sx={{ color: 'text.secondary', mb: 2 }}>
                Used for content sections within pages
              </Box>
            </Box>
            
            <SectionHeading variant="h3">Paragraph Styles</SectionHeading>
            
            <Box sx={{ mb: 4 }}>
              <LeadText>
                This is a lead paragraph that introduces a section or concept.
                It stands out from regular body text to grab attention.
              </LeadText>
              
              <TruncatedText lines={2} sx={{ mb: 2 }}>
                This is truncated text that will show an ellipsis after a specific number of lines.
                This is useful for card descriptions, list items, or anywhere space is limited.
                This text will be truncated after 2 lines regardless of how much content is here.
                Try resizing your browser window to see the truncation in action.
              </TruncatedText>
              
              <GradientText variant="h4" sx={{ mb: 2 }}>
                Gradient Text Example
              </GradientText>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <SectionHeading variant="h3">Extended Components</SectionHeading>
            
            <Box sx={{ mb: 4 }}>
              <HoverCard sx={{ p: 3, mb: 3 }}>
                <SectionHeading variant="h4">Hover Card</SectionHeading>
                <Box>
                  This card has a hover effect that lifts it slightly and adds a shadow.
                  Hover over it to see the effect.
                </Box>
              </HoverCard>
              
              <Box sx={{ mb: 4 }}>
                <SectionHeading variant="h4">Status Chips</SectionHeading>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <StatusChip label="Success" status="success" />
                  <StatusChip label="Warning" status="warning" />
                  <StatusChip label="Error" status="error" />
                  <StatusChip label="Info" status="info" />
                  <StatusChip label="Default" status="default" />
                </Box>
              </Box>
              
              <Box sx={{ mb: 4 }}>
                <SectionHeading variant="h4">Gradient Box</SectionHeading>
                <GradientBox>
                  This box has a gradient background with the theme's primary and secondary colors.
                </GradientBox>
                
                <GradientBox 
                  sx={{ mt: 2 }}
                  gradientStart="#FF4081" 
                  gradientEnd="#651FFF"
                  gradientDirection="to bottom"
                >
                  This box has a custom gradient with specified colors and direction.
                </GradientBox>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TypographyDemo; 