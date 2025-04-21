import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Button,
  Box,
  Chip,
  Alert
} from '@mui/material';
import { FaTag } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

interface TagCategoryFormData {
  name: string;
  description: string;
  tags: Array<{ id: string; name: string }>;
}

interface TagCategoryFormProps {
  open: boolean;
  formData: TagCategoryFormData;
  setFormData: React.Dispatch<React.SetStateAction<TagCategoryFormData>>;
  onClose: () => void;
  onSubmit: () => void;
  isEditing: boolean;
}

export const TagCategoryForm: React.FC<TagCategoryFormProps> = ({
  open,
  formData,
  setFormData,
  onClose,
  onSubmit,
  isEditing
}) => {
  const { tags } = useSelector((state: RootState) => state.tags);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagToggle = (tagId: string) => {
    setFormData(prev => {
      // Check if the tag is already in the tags array
      const tagIndex = prev.tags.findIndex(tag => tag.id === tagId);
      
      if (tagIndex !== -1) {
        // Remove tag if it exists
        return { 
          ...prev, 
          tags: prev.tags.filter(tag => tag.id !== tagId)
        };
      } else {
        // Add tag - find name from the tags array
        const tag = tags.find(t => t._id === tagId);
        return { 
          ...prev, 
          tags: [...prev.tags, { id: tagId, name: tag ? tag.name : 'Unknown' }]
        };
      }
    });
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEditing ? 'Edit Tag Category' : 'Create Tag Category'}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          name="name"
          label="Category Name"
          type="text"
          fullWidth
          variant="outlined"
          value={formData.name}
          onChange={handleInputChange}
          required
          sx={{ mb: 2 }}
        />
        <TextField
          margin="dense"
          name="description"
          label="Description (optional)"
          type="text"
          fullWidth
          variant="outlined"
          value={formData.description}
          onChange={handleInputChange}
          multiline
          rows={2}
          sx={{ mb: 3 }}
        />
        
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Select Tags for this Category
        </Typography>
        
        {tags.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            No tags available. Create tags first before adding them to categories.
          </Alert>
        ) : (
          <Box 
            sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 1, 
              maxHeight: '200px', 
              overflowY: 'auto',
              p: 2,
              border: '1px solid #e0e0e0',
              borderRadius: 1
            }}
          >
            {tags.map(tag => (
              <Chip
                key={tag._id}
                label={tag.name}
                icon={<FaTag />}
                onClick={() => handleTagToggle(tag._id)}
                color={formData.tags.some(t => t.id === tag._id) ? "primary" : "default"}
                variant={formData.tags.some(t => t.id === tag._id) ? "filled" : "outlined"}
                sx={{ m: 0.5 }}
              />
            ))}
          </Box>
        )}
        
        {formData.tags.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Selected Tags: {formData.tags.length}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {formData.tags.map(tag => (
                <Chip
                  key={tag.id}
                  label={tag.name}
                  onDelete={() => handleTagToggle(tag.id)}
                  color="primary"
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={onSubmit} 
          variant="contained" 
          color="primary"
          disabled={!formData.name.trim()}
        >
          {isEditing ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 