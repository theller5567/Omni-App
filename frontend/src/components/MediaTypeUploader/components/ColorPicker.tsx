import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Typography, Badge } from '@mui/material';
import { predefinedColors } from '../../../utils/mediaTypeUploaderUtils';
import { toast } from 'react-toastify';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  usedColors?: string[];
}

const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, usedColors = [] }) => {
  
  // Handler for color selection that prevents selecting already used colors
  const handleColorChange = (newValue: string) => {
    // Check if the color is already in use (and it's not the current value)
    const isUsed = usedColors.includes(newValue) && newValue !== value;
    
    if (isUsed) {
      const colorName = predefinedColors.find(c => c.hex === newValue)?.name || newValue;
      // Don't allow selection and show a warning
      // Show toast notification to the user
      toast.warning(`${colorName} is already in use by another media type. Please choose a different color.`);
      
      return; // Don't proceed with the change
    }
    
    // If we get here, the color is not in use, so we can select it
    onChange(newValue);
  };
  
  return (
    <FormControl fullWidth>
      <InputLabel id="color-select-label">Select Color</InputLabel>
      <Select
        labelId="color-select-label"
        id="color-select"
        value={value}
        onChange={(e) => handleColorChange(e.target.value)}
        label="Select Color"
        renderValue={(selected) => {
          const color = predefinedColors.find(c => c.hex === selected);
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ 
                width: 20, 
                height: 20, 
                bgcolor: selected, 
                borderRadius: '50%', 
                border: '1px solid rgba(0, 0, 0, 0.1)'
              }} />
              {color?.name || selected}
            </Box>
          );
        }}
      >
        {predefinedColors.map((color) => {
          // A color is considered "used" if it's in the usedColors array
          // AND it's not the currently selected color (value)
          const isUsed = usedColors.includes(color.hex) && color.hex !== value;
          
          return (
            <MenuItem 
              key={color.hex} 
              value={color.hex}
              disabled={isUsed}
              sx={{ 
                opacity: isUsed ? 0.5 : 1,
                position: 'relative',
                ...(isUsed && {
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.05)',
                  }
                })
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Badge
                  overlap="circular"
                  badgeContent={isUsed ? "✕" : ""}
                  color="error"
                  invisible={!isUsed}
                  sx={{ 
                    '& .MuiBadge-badge': { 
                      fontSize: '10px' 
                    }
                  }}
                >
                  <Box sx={{ 
                    width: 24, 
                    height: 24, 
                    bgcolor: color.hex, 
                    borderRadius: '50%', 
                    border: '1px solid rgba(0, 0, 0, 0.1)'
                  }} />
                </Badge>
                <Typography>
                  {color.name}
                  {isUsed && <Typography component="span" variant="caption" color="error" sx={{ ml: 1, fontWeight: 'bold' }}>(in use)</Typography>}
                </Typography>
              </Box>
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
};

export default ColorPicker; 