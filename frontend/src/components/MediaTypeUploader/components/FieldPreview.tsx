import React from 'react';
import { Box, Typography, Chip, List, ListItem } from '@mui/material';
import { MediaTypeField } from '../../../types/mediaTypes';
import { isSelectField } from '../../../utils/mediaTypeUploaderUtils';

interface FieldPreviewProps {
  fields: MediaTypeField[];
  onFieldSelect: (index: number) => void;
}

const FieldPreview: React.FC<FieldPreviewProps> = ({ fields, onFieldSelect }) => {
  if (fields.length === 0) {
    return (
      <div className="empty-message">
        <Typography>No fields added yet. Start by creating a field on the left.</Typography>
      </div>
    );
  }

  return (
    <List>
      {fields.map((field, index) => (
        <ListItem key={index} onClick={() => onFieldSelect(index)}>
          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2">
                {field.name}
                {field.required && (
                  <small className='required-badge' style={{marginLeft: '0.5rem', color: 'green', fontSize: '0.6rem'}}>* Required</small>
                )}
              </Typography>
              <Chip 
                size="small" 
                label={field.type}
                variant="outlined"
              />
            </Box>
            {isSelectField(field) && field.options.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="textSecondary">
                  Options: {field.options.join(', ')}
                </Typography>
              </Box>
            )}
          </Box>
        </ListItem>
      ))}
    </List>
  );
};

export default FieldPreview; 