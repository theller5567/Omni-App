import React, { useState, useEffect } from 'react';
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
  Alert,
  Paper,
  InputAdornment,
  Divider,
  IconButton
} from '@mui/material';
import { FaTag, FaSearch, FaPlus, FaTimes, FaArrowRight } from 'react-icons/fa';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided } from '@hello-pangea/dnd';
import { useUserProfile, useTags, useCreateTag, Tag } from '../../hooks/query-hooks';

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
  // Use TanStack Query hooks instead of Redux
  const { data: userProfile } = useUserProfile();
  const { data: tags = [] } = useTags(userProfile);
  const { mutateAsync: createTag } = useCreateTag();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [showCreateTag, setShowCreateTag] = useState(false);
  
  // Filter tags based on search term
  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Check if search term doesn't match any existing tags
  useEffect(() => {
    const tagExists = tags.some(tag => 
      tag.name.toLowerCase() === searchTerm.toLowerCase()
    );
    
    if (searchTerm && !tagExists && filteredTags.length === 0) {
      setShowCreateTag(true);
      setNewTagName(searchTerm);
    } else {
      setShowCreateTag(false);
      setNewTagName('');
    }
  }, [searchTerm, tags, filteredTags]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleTagToggle = (tagId: string, tagName: string) => {
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
        // Add tag
        return { 
          ...prev, 
          tags: [...prev.tags, { id: tagId, name: tagName }]
        };
      }
    });
  };
  
  const handleCreateNewTag = async () => {
    if (newTagName.trim()) {
      try {
        // Use TanStack Query mutation instead of Redux action
        const newTag = await createTag(newTagName.trim());
        
        // Add the newly created tag to the selected tags
        if (newTag && newTag._id) {
          handleTagToggle(newTag._id, newTag.name);
        }
        
        // Reset states
        setNewTagName('');
        setSearchTerm('');
        setShowCreateTag(false);
      } catch (error) {
        console.error('Failed to create new tag:', error);
      }
    }
  };
  
  const handleOnDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    if (result.source.droppableId === 'availableTags' && 
        result.destination.droppableId === 'selectedTags') {
      // User dragged from available to selected
      const tagId = result.draggableId;
      const tag = tags.find(t => t._id === tagId);
      if (tag && !formData.tags.some(t => t.id === tagId)) {
        handleTagToggle(tagId, tag.name);
      }
    } else if (result.source.droppableId === 'selectedTags' && 
               result.destination.droppableId === 'availableTags') {
      // User dragged from selected to available (remove)
      const tagId = result.draggableId;
      if (formData.tags.some(t => t.id === tagId)) {
        handleTagToggle(tagId, '');
      }
    }
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
          <DragDropContext onDragEnd={handleOnDragEnd}>
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              minHeight: '300px',
              maxHeight: '400px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {/* Left Column - Available Tags */}
              <Paper 
                elevation={0} 
                variant="outlined" 
                sx={{ 
                  width: '50%', 
                  p: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  flexGrow: 1
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Available Tags
                </Typography>
                
                <TextField
                  size="small"
                  placeholder="Search tags..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  variant="outlined"
                  fullWidth
                  sx={{ mb: 1 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FaSearch />
                      </InputAdornment>
                    ),
                    endAdornment: searchTerm ? (
                      <InputAdornment position="end">
                        <IconButton 
                          size="small" 
                          onClick={() => setSearchTerm('')}
                          edge="end"
                        >
                          <FaTimes />
                        </IconButton>
                      </InputAdornment>
                    ) : null
                  }}
                />
                
                {showCreateTag && (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 1, 
                    p: 1,
                    bgcolor: 'action.hover',
                    borderRadius: 1
                  }}>
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      Create new tag: <strong>{newTagName}</strong>
                    </Typography>
                    <Button 
                      size="small" 
                      variant="contained" 
                      color="primary" 
                      startIcon={<FaPlus />}
                      onClick={handleCreateNewTag}
                    >
                      Create
                    </Button>
                  </Box>
                )}
                
                <Droppable droppableId="availableTags">
                  {(provided: DroppableProvided) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{ 
                        flex: 1,
                        overflowY: 'auto',
                        minHeight: 0,
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignContent: 'flex-start',
                        gap: 0.5,
                        p: 1
                      }}
                    >
                      {filteredTags
                        .filter(tag => !formData.tags.some(t => t.id === tag._id))
                        .map((tag, index) => (
                          <Draggable key={tag._id} draggableId={tag._id} index={index}>
                            {(provided: DraggableProvided) => (
                              <Chip
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                label={tag.name}
                                icon={<FaTag />}
                                onClick={() => handleTagToggle(tag._id, tag.name)}
                                variant="outlined"
                                sx={{ m: 0.5 }}
                              />
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                      {filteredTags.length === 0 && !showCreateTag && (
                        <Typography variant="body2" color="text.secondary" sx={{ p: 1, width: '100%', textAlign: 'center' }}>
                          No matching tags found
                        </Typography>
                      )}
                    </Box>
                  )}
                </Droppable>
              </Paper>
              
              {/* Center - Drag Indicator */}
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <FaArrowRight />
                <Typography variant="caption" sx={{ mt: 1, textAlign: 'center', width: '60px' }}>
                  Drag and drop
                </Typography>
              </Box>
              
              {/* Right Column - Selected Tags */}
              <Paper 
                elevation={0} 
                variant="outlined" 
                sx={{ 
                  width: '50%', 
                  p: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  flexGrow: 1
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Selected Tags ({formData.tags.length})
                </Typography>
                
                <Droppable droppableId="selectedTags">
                  {(provided: DroppableProvided) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{ 
                        flex: 1,
                        overflowY: 'auto',
                        minHeight: 0,
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignContent: 'flex-start',
                        gap: 0.5,
                        p: 1,
                        backgroundColor: formData.tags.length ? 'inherit' : 'action.hover'
                      }}
                    >
                      {formData.tags.length > 0 ? (
                        formData.tags.map((tag, index) => (
                          <Draggable key={tag.id} draggableId={tag.id} index={index}>
                            {(provided: DraggableProvided) => (
                              <Chip
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                label={tag.name}
                                onDelete={() => handleTagToggle(tag.id, tag.name)}
                                color="primary"
                                size="medium"
                                sx={{ m: 0.5 }}
                              />
                            )}
                          </Draggable>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ p: 1, width: '100%', textAlign: 'center' }}>
                          Drag tags here or click on tags to select
                        </Typography>
                      )}
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              </Paper>
            </Box>
          </DragDropContext>
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

// Add default export for lazy loading
export default TagCategoryForm; 