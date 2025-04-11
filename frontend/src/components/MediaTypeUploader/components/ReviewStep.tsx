import React, { useEffect } from 'react';
import { Box, Typography, Chip, List, ListItem, ListItemText } from '@mui/material';
import { FaExclamationCircle, FaTag } from 'react-icons/fa';
import { MediaTypeConfig } from '../../../types/mediaTypes';
import { isSelectField, predefinedColors } from '../../../utils/mediaTypeUploaderUtils';

interface ReviewStepProps {
  mediaTypeConfig: MediaTypeConfig;
  inputOptions: string[];
  isSuperAdmin?: boolean;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ mediaTypeConfig, inputOptions, isSuperAdmin = false }) => {
  // Add debugging to check the value of catColor
  useEffect(() => {
    console.log('ReviewStep - mediaTypeConfig:', mediaTypeConfig);
    console.log('ReviewStep - catColor value:', mediaTypeConfig.catColor);
  }, [mediaTypeConfig]);
  
  return (
    <div className="step-container step2">
      {/* TEST ELEMENT TO CONFIRM THIS COMPONENT IS BEING USED */}
     
      <div className="media-type-summary">
        <h4>Media Type: {mediaTypeConfig.name}</h4>
        
        {/* Add color display section */}
        <Box sx={{ mt: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">Selected Color:</Typography>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
          }}>
            <Box 
              sx={{ 
                width: 20, 
                height: 20, 
                backgroundColor: mediaTypeConfig.catColor || '#2196f3',
                borderRadius: '50%',
                boxShadow: '0 0 3px rgba(0,0,0,0.3)'
              }} 
            />
            <Typography variant="h6">
              {predefinedColors.find(c => c.hex === mediaTypeConfig.catColor)?.name || 'Default Blue'}
            </Typography>
          </Box>
        </Box>
        
        <Typography variant="body1">
          This media type will have {mediaTypeConfig.fields.length} field{mediaTypeConfig.fields.length !== 1 ? 's' : ''}.
          {mediaTypeConfig.fields.filter(f => f.required).length > 0 && (
            <span> {mediaTypeConfig.fields.filter(f => f.required).length} field{mediaTypeConfig.fields.filter(f => f.required).length !== 1 ? 's are' : ' is'} required.</span>
          )}
        </Typography>
        
        {/* Default Tags Section */}
        {mediaTypeConfig.defaultTags && mediaTypeConfig.defaultTags.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FaTag /> Default Tags:
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              These tags will be automatically applied to all media files created with this type.
              {!isSuperAdmin && (
                <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                  * Only Super Admins can modify default tags after creation
                </Typography>
              )}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              {mediaTypeConfig.defaultTags.map((tag, index) => (
                <Chip 
                  key={index}
                  label={tag}
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ m: 0.5 }}
                />
              ))}
            </Box>
          </Box>
        )}
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1">Accepted File Types:</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {mediaTypeConfig.acceptedFileTypes.map((type) => (
              <Chip 
                key={type}
                label={type}
                sx={{ m: 0.5 }}
              />
            ))}
          </Box>
        </Box>
        
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {inputOptions.map(type => {
            const count = mediaTypeConfig.fields.filter(f => f.type === type).length;
            if (count === 0) return null;
            return (
              <Chip 
                key={type} 
                label={`${type}: ${count}`} 
                sx={{ 
                  backgroundColor: 'rgba(25, 118, 210, 0.2)',
                  borderRadius: '4px',
                  fontSize: '0.8rem'
                }} 
              />
            );
          })}
        </Box>
      </div>
      
      <div className="field-list-container">
        <h6>Field Details:</h6>
        <List>
          {mediaTypeConfig.fields.map((field, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {field.name}
                    {field.required && 
                      <span className="required-badge">Required</span>
                    }
                  </Box>
                }
                secondary={
                  <>
                    <Typography component="span" variant="body2">
                      Type: {field.type}
                    </Typography>
                    {isSelectField(field) && field.options.length > 0 && (
                      <Box mt={1}>
                        <Typography component="span" variant="body2">
                          Options: {field.options.join(', ')}
                        </Typography>
                      </Box>
                    )}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      </div>
      
      <Box className="confirmation-message">
        <Typography variant="body2">
          <FaExclamationCircle style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Please review the media type details above before proceeding. Once created, only an admin can modify it.
        </Typography>
      </Box>
    </div>
  );
};

export default ReviewStep; 