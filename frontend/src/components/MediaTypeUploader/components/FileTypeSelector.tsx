import React from 'react';
import { Box, Typography, Checkbox, FormControlLabel, Chip } from '@mui/material';
import { FileTypeCategory, isCategorySelected, isCategoryPartiallySelected } from '../../../utils/mediaTypeUploaderUtils';

interface FileTypeSelectorProps {
  fileTypeCategories: FileTypeCategory[];
  acceptedFileTypes: string[];
  onChange: (newAcceptedFileTypes: string[]) => void;
}

const FileTypeSelector: React.FC<FileTypeSelectorProps> = ({ 
  fileTypeCategories, 
  acceptedFileTypes, 
  onChange 
}) => {
  const handleCategoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const categoryName = event.target.name;
    const isChecked = event.target.checked;
    
    // Find the category
    const category = fileTypeCategories.find(cat => cat.name === categoryName);
    
    if (category) {
      if (isChecked) {
        // Add all MIME types from this category
        onChange([...acceptedFileTypes, ...category.mimeTypes]);
      } else {
        // Remove all MIME types from this category
        onChange(acceptedFileTypes.filter(type => !category.mimeTypes.includes(type)));
      }
    }
  };

  const handleTypeClick = (type: string) => {
    if (acceptedFileTypes.includes(type)) {
      onChange(acceptedFileTypes.filter(t => t !== type));
    } else {
      onChange([...acceptedFileTypes, type]);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Select which file types this media type will accept during uploads
      </Typography>
    
      <Box sx={{ display: {xs: 'block', sm: 'grid'}, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, overflowX: 'hidden' }}>
        {fileTypeCategories.map((category) => (
          <div key={category.name} className="file-type-category">
            <FormControlLabel
              control={
                <Checkbox 
                  checked={isCategorySelected(category.name, fileTypeCategories, acceptedFileTypes)}
                  indeterminate={isCategoryPartiallySelected(category.name, fileTypeCategories, acceptedFileTypes)}
                  onChange={handleCategoryChange}
                  name={category.name}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {category.icon}
                  <span>{category.label}</span>
                </Box>
              }
            />
            
            <Box sx={{ pl: { xs: 2, sm: 4 }, pb: 2, pr: 0, display: 'flex', flexWrap: 'wrap', overflowX: 'hidden' }}>
              {category.mimeTypes.map((type) => (
                <Chip 
                  key={type}
                  size='small'
                  label={type}
                  variant={acceptedFileTypes.includes(type) ? "filled" : "outlined"}
                  onClick={() => handleTypeClick(type)}
                  title={type}
                  sx={{ 
                    m: 0.5,
                    maxWidth: '100%',
                    overflow: 'hidden',
                    '& .MuiChip-label': {
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: { xs: '0.72rem', sm: '0.75rem' }
                    }
                  }}
                />
              ))}
            </Box>
          </div>
        ))}
      </Box>
    </Box>
  );
};

export default FileTypeSelector; 