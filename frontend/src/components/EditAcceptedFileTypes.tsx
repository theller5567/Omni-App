import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box, 
  FormGroup, 
  Checkbox, 
  FormControlLabel, 
  Chip,
  TextField,
} from '@mui/material';
import { FaImage, FaVideo, FaFileAudio, FaFileWord, FaPlus } from 'react-icons/fa';
import { MediaType } from '../hooks/query-hooks';
import './MediaTypeUploader.scss';

interface FileTypeCategory {
  name: string;
  label: string;
  icon: React.ReactNode;
  mimeTypes: string[];
}

const fileTypeCategories: FileTypeCategory[] = [
  { 
    name: 'images', 
    label: 'Images', 
    icon: <FaImage />, 
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'] 
  },
  { 
    name: 'videos', 
    label: 'Videos', 
    icon: <FaVideo />, 
    mimeTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'] 
  },
  { 
    name: 'audio', 
    label: 'Audio', 
    icon: <FaFileAudio />, 
    mimeTypes: ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm'] 
  },
  { 
    name: 'documents', 
    label: 'Documents', 
    icon: <FaFileWord />, 
    mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'] 
  }
];

interface EditAcceptedFileTypesProps {
  open: boolean;
  onClose: () => void;
  mediaType: MediaType | null;
  onSave: (acceptedFileTypes: string[]) => void;
}

const EditAcceptedFileTypes: React.FC<EditAcceptedFileTypesProps> = ({
  open,
  onClose,
  mediaType,
  onSave
}) => {
  const [selectedFileTypes, setSelectedFileTypes] = useState<string[]>([]);
  const [customMimeType, setCustomMimeType] = useState('');
  const [customMimeTypes, setCustomMimeTypes] = useState<string[]>([]);

  useEffect(() => {
    if (mediaType && open) {
      setSelectedFileTypes(mediaType.acceptedFileTypes || []);
      
      // Identify custom MIME types (not in any category)
      const allCategoryMimeTypes = fileTypeCategories.flatMap(category => category.mimeTypes);
      const customTypes = (mediaType.acceptedFileTypes || []).filter(
        type => !allCategoryMimeTypes.includes(type)
      );
      
      setCustomMimeTypes(customTypes);
    }
  }, [mediaType, open]);

  const handleFileTypeCategoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const categoryName = event.target.name;
    const isChecked = event.target.checked;
    
    // Find the category
    const category = fileTypeCategories.find(cat => cat.name === categoryName);
    
    if (category) {
      if (isChecked) {
        // Add all MIME types from this category
        setSelectedFileTypes(prev => [...prev, ...category.mimeTypes]);
      } else {
        // Remove all MIME types from this category
        setSelectedFileTypes(prev => prev.filter(type => !category.mimeTypes.includes(type)));
      }
    }
  };

  const handleAddCustomMimeType = () => {
    if (customMimeType.trim() && !customMimeTypes.includes(customMimeType)) {
      setCustomMimeTypes(prev => [...prev, customMimeType]);
      setSelectedFileTypes(prev => [...prev, customMimeType]);
      setCustomMimeType('');
    }
  };

  const handleRemoveCustomMimeType = (mimeType: string) => {
    setCustomMimeTypes(prev => prev.filter(type => type !== mimeType));
    setSelectedFileTypes(prev => prev.filter(type => type !== mimeType));
  };

  const isCategorySelected = (categoryName: string) => {
    const category = fileTypeCategories.find(cat => cat.name === categoryName);
    if (!category) return false;
    
    // Check if all MIME types in this category are selected
    return category.mimeTypes.every(type => selectedFileTypes.includes(type));
  };

  const isCategoryPartiallySelected = (categoryName: string) => {
    const category = fileTypeCategories.find(cat => cat.name === categoryName);
    if (!category) return false;
    
    // Check if some (but not all) MIME types in this category are selected
    const selectedCount = category.mimeTypes.filter(type => selectedFileTypes.includes(type)).length;
    return selectedCount > 0 && selectedCount < category.mimeTypes.length;
  };

  const handleSave = () => {
    if (selectedFileTypes.length === 0) {
      alert('Please select at least one file type');
      return;
    }
    onSave(selectedFileTypes);
  };

  if (!mediaType) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Edit Accepted File Types for "{mediaType.name}"
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Select which file types this media type will accept during uploads. 
          {(mediaType.usageCount ?? 0) > 0 && (
            <Box component="span" fontWeight="bold" sx={{ ml: 1 }}>
              This media type is used by {mediaType.usageCount} existing file{mediaType.usageCount !== 1 ? 's' : ''}.
            </Box>
          )}
        </Typography>
        
        <FormGroup>
          {fileTypeCategories.map((category) => (
            <div key={category.name} className="file-type-category">
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={isCategorySelected(category.name)}
                    indeterminate={isCategoryPartiallySelected(category.name)}
                    onChange={handleFileTypeCategoryChange}
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
              
              <Box sx={{ pl: 4, pb: 2 }}>
                {category.mimeTypes.map((type) => (
                  <Chip 
                    key={type}
                    label={type}
                    variant={selectedFileTypes.includes(type) ? "filled" : "outlined"}
                    onClick={() => {
                      if (selectedFileTypes.includes(type)) {
                        setSelectedFileTypes(prev => prev.filter(t => t !== type));
                      } else {
                        setSelectedFileTypes(prev => [...prev, type]);
                      }
                    }}
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
            </div>
          ))}
        </FormGroup>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1">Add Custom MIME Type</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
            <TextField
              placeholder="e.g., application/json"
              value={customMimeType}
              onChange={(e) => setCustomMimeType(e.target.value)}
              size="small"
              fullWidth
            />
            <Button 
              variant="contained" 
              onClick={handleAddCustomMimeType}
              disabled={!customMimeType.trim()}
              startIcon={<FaPlus />}
            >
              Add
            </Button>
          </Box>
          
          {customMimeTypes.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Custom MIME Types:</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {customMimeTypes.map((type) => (
                  <Chip 
                    key={type}
                    label={type}
                    onDelete={() => handleRemoveCustomMimeType(type)}
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
        
        {selectedFileTypes.length === 0 && (
          <Typography color="error" sx={{ mt: 2 }}>
            Please select at least one file type that will be accepted
          </Typography>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          color="primary" 
          variant="contained"
          disabled={selectedFileTypes.length === 0}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditAcceptedFileTypes; 