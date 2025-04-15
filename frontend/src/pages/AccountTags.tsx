import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import { fetchTags, addTag, updateTag, deleteTag } from "../store/slices/tagSlice";
import { 
  Box, 
  Button, 
  TextField, 
  List, 
  ListItem, 
  IconButton, 
  Typography, 
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  InputAdornment,
  Grid,
  Divider,
  Tooltip,
  useMediaQuery,
  Theme
} from "@mui/material";
import { FaEdit, FaTrash, FaPlus, FaSearch, FaTimes } from "react-icons/fa";
import { motion } from "framer-motion";
import "./accountTags.scss";

const AccountTags: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [searchTerm, setSearchTerm] = useState("");
  const [newTag, setNewTag] = useState("");
  const [editingTag, setEditingTag] = useState<{ id: string; name: string } | null>(null);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const { tags, status } = useSelector((state: RootState) => state.tags);
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

  useEffect(() => {
    if (status === 'idle' && tags.length === 0) {
      dispatch(fetchTags());
    }
  }, [dispatch, status, tags.length]);

  const handleAddTag = () => {
    if (newTag.trim()) {
      dispatch(addTag(newTag.trim()));
      setNewTag("");
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleAddTag();
    }
  };

  const handleDeleteTagConfirm = () => {
    if (tagToDelete) {
      dispatch(deleteTag(tagToDelete));
      setTagToDelete(null);
    }
  };

  const handleEditTag = () => {
    if (editingTag && editingTag.name.trim()) {
      dispatch(updateTag({ id: editingTag.id, name: editingTag.name.trim() }));
      setEditingTag(null);
    }
  };

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0, x: isMobile ? -100 : -350 },
    visible: { opacity: 1, x: 0, transition: { duration: isMobile ? 0.3 : 0.5 } },
    exit: { opacity: 0, x: isMobile ? -100 : -350, transition: { duration: isMobile ? 0.3 : 0.5 } },
  };

  return (
    <motion.div
      id="account-tags"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <Box className="account-tags" sx={{ width: "100%", overflow: "hidden" }}>
        <Typography variant="h2" align="left" sx={{ paddingBottom: isMobile ? "1rem" : "2rem" }}>
          Manage Tags
        </Typography>
        
        <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Create New Tag
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                label="New Tag Name"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                fullWidth
                margin="normal"
                variant="outlined"
                placeholder="Enter a tag name"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaPlus color="var(--accent-color)" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button 
                onClick={handleAddTag} 
                variant="contained" 
                color="primary"
                fullWidth
                disabled={!newTag.trim()}
                sx={{ height: isMobile ? '40px' : '56px', mt: isMobile ? 0 : 2 }}
              >
                Add New Tag
              </Button>
            </Grid>
          </Grid>
        </Paper>
        
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Manage Existing Tags
          </Typography>
          
          <TextField
            label="Search Tags"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FaSearch color="var(--accent-color)" />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm("")}>
                    <FaTimes />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <Divider sx={{ mb: 3 }} />
          
          {filteredTags.length === 0 ? (
            <Box className="no-tags" sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                {searchTerm ? "No tags match your search" : "No tags found. Create your first tag above."}
              </Typography>
            </Box>
          ) : (
            <Box className="tags-container" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
              {filteredTags.map((tag) => (
                <Chip
                  key={tag._id}
                  label={tag.name}
                  className="account-tag"
                  deleteIcon={
                    <Box sx={{ display: 'flex' }}>
                      <Tooltip title="Edit Tag">
                        <IconButton size="small" onClick={(e) => {
                          e.stopPropagation();
                          setEditingTag({ id: tag._id, name: tag.name });
                        }}>
                          <FaEdit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Tag">
                        <IconButton size="small" onClick={(e) => {
                          e.stopPropagation();
                          setTagToDelete(tag._id);
                        }}>
                          <FaTrash />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                  onDelete={() => {}}
                  sx={{
                    bgcolor: 'var(--background-color)',
                    border: '1px solid var(--accent-color)',
                    color: 'var(--text-color)',
                    py: 2.5,
                    px: 1,
                    borderRadius: '16px',
                    fontWeight: 500,
                    '& .MuiChip-deleteIcon': {
                      color: 'var(--text-color)',
                      opacity: 0.7,
                      '&:hover': {
                        opacity: 1,
                        color: 'var(--accent-color)',
                      },
                    },
                  }}
                />
              ))}
            </Box>
          )}
          
          {status === 'loading' && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography>Loading tags...</Typography>
            </Box>
          )}
        </Paper>
      </Box>
      
      {/* Edit Dialog */}
      <Dialog open={!!editingTag} onClose={() => setEditingTag(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Tag</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tag Name"
            type="text"
            fullWidth
            value={editingTag?.name || ''}
            onChange={(e) => editingTag && setEditingTag({ ...editingTag, name: e.target.value })}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingTag(null)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleEditTag} color="primary" variant="contained" disabled={!editingTag?.name.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!tagToDelete} onClose={() => setTagToDelete(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this tag? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTagToDelete(null)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteTagConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};

export default AccountTags;
