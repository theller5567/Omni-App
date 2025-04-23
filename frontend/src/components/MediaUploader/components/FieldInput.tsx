import React from "react";
import {
  TextField,
  FormControl,
  Select,
  MenuItem,
  Box,
  Chip,
} from "@mui/material";
import { TagCategory } from "../../../store/slices/tagCategorySlice";
import { MetadataState } from "../types";

interface Field {
  type: string;
  options?: string[];
  required?: boolean;
  name?: string;
  useTagCategory?: boolean;
  tagCategoryId?: string;
}

interface FieldInputProps {
  field: Field;
  keyName: string;
  metadata: MetadataState;
  tagCategories: TagCategory[];
  handleMetadataChange: (field: string, value: any) => void;
}

// Type guard to check if a field is a tag category field
const isTagCategoryField = (field: Field): boolean => {
  return !!field.useTagCategory && !!field.tagCategoryId;
};

// Helper function to safely get tag options based on category ID
const getTagOptionsFromCategory = (tagCategoryId: string, tagCategories: TagCategory[]): string[] => {
  const category = tagCategories.find(cat => cat._id === tagCategoryId);
  return category?.tags?.map(tag => tag.name) || [];
};

const FieldInput: React.FC<FieldInputProps> = ({ 
  field, 
  keyName, 
  metadata, 
  tagCategories, 
  handleMetadataChange 
}) => {
  
  switch (field.type) {
    case 'TextArea':
      return (
        <TextField
          fullWidth
          multiline
          rows={4}
          value={metadata[keyName] || ""}
          onChange={(e) => handleMetadataChange(keyName, e.target.value)}
          margin="none"
          variant="outlined"
          size="small"
          InputProps={{
            sx: { bgcolor: 'background.paper', borderRadius: 1 }
          }}
        />
      );
    
    case 'Select': {
      // Get options based on field configuration
      let selectOptions: string[] = [];
      
      if (isTagCategoryField(field) && field.tagCategoryId) {
        selectOptions = getTagOptionsFromCategory(field.tagCategoryId, tagCategories);
      } else {
        selectOptions = field.options || [];
      }
      
      return (
        <FormControl fullWidth size="small">
          <Select
            name={keyName}
            value={metadata[keyName] || ''}
            onChange={(e) => handleMetadataChange(keyName, e.target.value)}
            sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
          >
            {selectOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }
    
    case 'MultiSelect': {
      // Get options based on field configuration
      let multiSelectOptions: string[] = [];
      
      if (isTagCategoryField(field) && field.tagCategoryId) {
        multiSelectOptions = getTagOptionsFromCategory(field.tagCategoryId, tagCategories);
      } else {
        multiSelectOptions = field.options || [];
      }
      
      return (
        <FormControl fullWidth size="small">
          <Select
            name={keyName}
            multiple
            value={Array.isArray(metadata[keyName]) ? metadata[keyName] : []}
            onChange={(e) => handleMetadataChange(keyName, e.target.value)}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {(selected as string[]).map((value) => (
                  <Chip 
                    key={value} 
                    label={value} 
                    size="small" 
                    sx={{ 
                      bgcolor: 'rgba(0, 0, 0, 0.08)', 
                      height: '24px',
                      '& .MuiChip-label': {
                        padding: '0 8px'
                      }
                    }}
                  />
                ))}
              </Box>
            )}
            sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 224,
                  width: 250,
                },
              },
            }}
          >
            {multiSelectOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }
      
    case 'Number':
      return (
        <TextField
          type="number"
          fullWidth
          value={metadata[keyName] || ""}
          onChange={(e) => handleMetadataChange(keyName, e.target.value)}
          margin="none"
          variant="outlined"
          size="small"
          InputProps={{
            sx: { bgcolor: 'background.paper', borderRadius: 1 }
          }}
        />
      );
      
    case 'Date':
      return (
        <TextField
          type="date"
          fullWidth
          value={metadata[keyName] || ""}
          onChange={(e) => handleMetadataChange(keyName, e.target.value)}
          margin="none"
          variant="outlined"
          size="small"
          InputProps={{
            sx: { bgcolor: 'background.paper', borderRadius: 1 }
          }}
        />
      );
      
    case 'Boolean':
      return (
        <FormControl fullWidth size="small">
          <Select
            value={metadata[keyName] !== undefined ? metadata[keyName] : "false"}
            onChange={(e) => handleMetadataChange(keyName, e.target.value)}
            sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
          >
            <MenuItem value="true">Yes</MenuItem>
            <MenuItem value="false">No</MenuItem>
          </Select>
        </FormControl>
      );
      
      // Default case for Text fields and others
    default:
      return (
        <TextField
          fullWidth
          value={metadata[keyName] || ""}
          onChange={(e) => handleMetadataChange(keyName, e.target.value)}
          margin="none"
          variant="outlined"
          size="small"
          InputProps={{
            sx: { bgcolor: 'background.paper', borderRadius: 1 }
          }}
        />
      );
  }
};

export default FieldInput; 