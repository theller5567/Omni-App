import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import { fetchTags, addTag, updateTag, deleteTag } from "../store/slices/tagSlice";
import { 
  Box, 
  Button, 
  TextField, 
  IconButton, 
  Typography, 
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
  Theme,
  Container
} from "@mui/material";
import { FaEdit, FaTrash, FaPlus, FaSearch, FaTimes, FaTag } from "react-icons/fa";
import { motion } from "framer-motion";
import { normalizeTag, hasUppercase, validateTag } from "../utils/tagUtils";
import "./accountTags.scss";

const AccountTags: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [searchTerm, setSearchTerm] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [editingTag, setEditingTag] = useState<{ id: string; name: string } | null>(null);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const { tags, status } = useSelector((state: RootState) => state.tags);
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  const [tagError, setTagError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'idle' && tags.length === 0) {
      dispatch(fetchTags());
    }
  }, [dispatch, status, tags.length]);

  useEffect(() => {
    if (newTagName) {
      const validation = validateTag(newTagName);
      setTagError(validation.valid ? null : validation.message || null);
    } else {
      setTagError(null);
    }
  }, [newTagName]);

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagName.trim() && validateTag(newTagName).valid) {
      dispatch(addTag(normalizeTag(newTagName)));
      setNewTagName("");
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleCreateTag(event);
    }
  };

  const handleDeleteTag = () => {
    if (tagToDelete) {
      dispatch(deleteTag(tagToDelete));
      setTagToDelete(null);
    }
  };

  const handleUpdateTag = () => {
    if (editingTag && editingTag.name.trim()) {
      const validation = validateTag(editingTag.name);
      if (validation.valid) {
        dispatch(updateTag({
          id: editingTag.id,
          name: normalizeTag(editingTag.name)
        }));
        setEditingTag(null);
      }
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
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h1" sx={{ mb: 3 }}>Tag Management</Typography>
          
          <Paper elevation={3} sx={{ p: 4, borderRadius: '12px', bgcolor: 'background.paper', mb: 3 }}>
            {/* Create New Tag Section */}
            <Box sx={{ mb: 6 }}>
              <Typography variant="h6" sx={{ mb: 4 }}>Create New Tag</Typography>
              <Box component="form" onSubmit={handleCreateTag} sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'flex-start', gap: 2 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="New Tag Name"
                  value={newTagName}
                  sx={{ maxWidth: '400px' }}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter tag name"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FaTag size={16} />
                      </InputAdornment>
                    ),
                  }}
                  error={!!tagError}
                  helperText={
                    tagError || 
                    (newTagName && hasUppercase(newTagName) 
                      ? "Tags will be saved in lowercase for consistency" 
                      : " ")
                  }
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={!newTagName.trim() || (newTagName ? !validateTag(newTagName).valid : false) || status === 'loading'}
                  sx={{ 
                    px: 3, 
                    height: '56px', 
                    alignSelf: { xs: 'stretch', md: 'flex-start' },
                    minWidth: { xs: '100%', md: '180px' }
                  }}
                  startIcon={<FaPlus />}
                >
                  Add New Tag
                </Button>
              </Box>
            </Box>
            
            <Divider sx={{ my: 4 }} />
            
            {/* Manage Existing Tags Section */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" sx={{ mb: 4 }}>
                Manage Existing Tags
              </Typography>
              
              <TextField
                fullWidth
                variant="outlined"
                label="Search Tags"
                sx={{ maxWidth: '400px', mb: 6 }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaSearch size={16} />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setSearchTerm('')} edge="end" size="small">
                        <FaTimes />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                placeholder="Filter tags by name"
              />
              
              <Divider sx={{ mb: 3 }} />
              
              {filteredTags.length === 0 ? (
                <Box sx={{ mt: 2, textAlign: 'center', p: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    {tags.length === 0 
                      ? "No tags found. Create your first tag to get started!" 
                      : "No tags match your search criteria."}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    {filteredTags.map((tag) => (
                      <Grid item xs={12} sm={6} md={4} lg={3} xl={2} key={tag._id}>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Paper
                            elevation={1}
                            sx={{
                              p: 2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              borderRadius: '8px',
                              border: '1px solid',
                              borderColor: 'divider',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                boxShadow: 2,
                                borderColor: 'primary.main',
                              }
                            }}
                          >
                            <Typography variant="body1" sx={{ 
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              width: '60%'
                            }}>
                              {tag.name}
                            </Typography>
                            <Box>
                              <Tooltip title="Edit Tag">
                                <IconButton
                                  size="small"
                                  onClick={() => setEditingTag({ id: tag._id, name: tag.name })}
                                  sx={{ color: 'primary.main', mr: 1 }}
                                >
                                  <FaEdit />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Tag">
                                <IconButton
                                  size="small"
                                  onClick={() => setTagToDelete(tag._id)}
                                  sx={{ color: 'error.main' }}
                                >
                                  <FaTrash />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Paper>
                        </motion.div>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
              
              {status === 'loading' && (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography>Loading tags...</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </motion.div>
      </Container>
      
      {/* Edit Dialog */}
      <Dialog 
        open={!!editingTag} 
        onClose={() => setEditingTag(null)}
        PaperProps={{
          sx: { borderRadius: '12px', maxWidth: '500px', width: '100%' }
        }}
      >
        <DialogTitle>
          <Typography variant="h6">Edit Tag</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            fullWidth
            label="Tag Name"
            variant="outlined"
            value={editingTag?.name || ""}
            onChange={(e) => setEditingTag(prev => prev ? { ...prev, name: e.target.value } : null)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FaTag size={16} />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Updating a tag will affect all media files that use this tag.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setEditingTag(null)} color="inherit" variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateTag} 
            color="primary" 
            variant="contained"
            disabled={!editingTag?.name.trim() || editingTag?.name.trim() === tags.find(t => t._id === editingTag.id)?.name}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!tagToDelete}
        onClose={() => setTagToDelete(null)}
        PaperProps={{
          sx: { borderRadius: '12px', maxWidth: '500px', width: '100%' }
        }}
      >
        <DialogTitle>
          <Typography variant="h6">Confirm Delete</Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body1">
            Are you sure you want to delete this tag? This action cannot be undone.
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            Any media files using this tag will have it removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setTagToDelete(null)} color="inherit" variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleDeleteTag} color="error" variant="contained">
            Delete Tag
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};

export default AccountTags;
