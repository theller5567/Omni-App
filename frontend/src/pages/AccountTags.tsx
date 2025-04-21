import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import { fetchTags, addTag, updateTag, deleteTag } from "../store/slices/tagSlice";
import TagCategoryManager from "../components/TagCategoryManager/TagCategoryManager";
import { toast } from "react-toastify";
import { resetTagCategories } from "../store/slices/tagCategorySlice";

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
  useMediaQuery,
  Theme,
  Container,
  Alert,
  Tabs,
  Tab,
  Chip,
  Pagination,
  InputBase,
  Card,
  CardContent,
  Stack,
  CircularProgress,
  alpha
} from "@mui/material";
import { FaEdit, FaTrash, FaPlus, FaSearch, FaTimes, FaTag, FaRedo } from "react-icons/fa";
import { motion } from "framer-motion";
import { normalizeTag, normalizeTagForComparison, validateTag, areTagsEquivalent } from "../utils/tagUtils";
import "./accountTags.scss";

const TAGS_PER_PAGE = 30;

const AccountTags: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [searchTerm, setSearchTerm] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [editingTag, setEditingTag] = useState<{ id: string; name: string } | null>(null);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const { tags, status } = useSelector((state: RootState) => state.tags);
  const { tagCategories } = useSelector((state: RootState) => state.tagCategories);
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  const [tagError, setTagError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(1);

  // Memoized value for total tag count
  const totalTagCount = useMemo(() => tags.length, [tags]);

  useEffect(() => {
    if (status === 'idle' && tags.length === 0) {
      dispatch(fetchTags());
    }
  }, [dispatch, status, tags.length]);

  useEffect(() => {
    if (newTagName) {
      const validation = validateTag(newTagName);
      
      // Check for duplicate tags (case-insensitive)
      if (validation.valid && tags.some(tag => 
        areTagsEquivalent(tag.name, newTagName)
      )) {
        setTagError(`Tag "${newTagName}" already exists`);
      } else {
        setTagError(validation.valid ? null : validation.message || null);
      }
    } else {
      setTagError(null);
    }
  }, [newTagName, tags]);

  const handleResetData = async () => {
    try {
      setIsResetting(true);
      await dispatch(resetTagCategories());
      toast.success('Tag categories state reset successfully');
      window.location.reload(); // Force a full page reload to clear everything
    } catch (err) {
      console.error('Failed to reset data:', err);
      toast.error('Failed to reset tag categories');
    } finally {
      setIsResetting(false);
    }
  };

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagName.trim() && validateTag(newTagName).valid) {
      // Check for duplicates one more time before submitting
      if (tags.some(tag => areTagsEquivalent(tag.name, newTagName))) {
        setTagError(`Tag "${newTagName}" already exists`);
        return;
      }
      
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
      dispatch(deleteTag(tagToDelete))
        .unwrap()
        .then(() => {
          toast.success('Tag deleted successfully');
          setTagToDelete(null);
        })
        .catch((error) => {
          console.error('Failed to delete tag:', error);
          toast.error(`Failed to delete tag: ${error || 'Unknown error'}`);
          setTagToDelete(null);
        });
    }
  };

  const handleUpdateTag = () => {
    if (editingTag && editingTag.name.trim()) {
      const validation = validateTag(editingTag.name);
      
      // Check for duplicates, but exclude current tag from the check
      const hasDuplicate = tags.some(tag => 
        tag._id !== editingTag.id && 
        areTagsEquivalent(tag.name, editingTag.name)
      );
      
      if (hasDuplicate) {
        toast.error(`Tag "${editingTag.name}" already exists`);
        return;
      }
      
      if (validation.valid) {
        dispatch(updateTag({
          id: editingTag.id,
          name: normalizeTag(editingTag.name)
        }));
        setEditingTag(null);
      }
    }
  };

  const filteredTags = useMemo(() => {
    return tags.filter((tag) =>
      normalizeTagForComparison(tag.name).includes(normalizeTagForComparison(searchTerm))
    );
  }, [tags, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredTags.length / TAGS_PER_PAGE);
  const paginatedTags = useMemo(() => {
    const startIndex = (page - 1) * TAGS_PER_PAGE;
    return filteredTags.slice(startIndex, startIndex + TAGS_PER_PAGE);
  }, [filteredTags, page]);

  const handleChangePage = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: 20, transition: { duration: 0.3 } },
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <motion.div
      id="account-tags"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h1" fontSize={{ xs: '2rem', md: '2.5rem' }}>Tag Management</Typography>
          </Box>
          <Button
            variant="outlined"
            color="warning"
            startIcon={<FaRedo />}
            onClick={handleResetData}
            disabled={isResetting}
            size="small"
            sx={{ height: '36px' }}
          >
            {isResetting ? 'Resetting...' : 'Reset All Tag Data'}
          </Button>
        </Box>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          If you're experiencing issues with tag categories not displaying correctly or getting errors about categories already existing, try the "Reset All Tag Data" button.
        </Alert>
        
        <Paper elevation={3} sx={{ borderRadius: '12px', bgcolor: 'background.paper', overflow: 'hidden' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              bgcolor: theme => alpha(theme.palette.primary.main, 0.05)
            }}
            variant="fullWidth"
          >
            <Tab label={`Tag Categories (${tagCategories.length})`} />
            <Tab label={`Create & Manage Tags (${totalTagCount})`} />
          </Tabs>

          {/* Tag Categories Tab */}
          <Box sx={{ display: activeTab === 0 ? 'block' : 'none', p: { xs: 2, md: 3 } }}>
            <TagCategoryManager />
          </Box>

          {/* Create & Manage Tags Tab */}
          <Box sx={{ display: activeTab === 1 ? 'block' : 'none', p: { xs: 2, md: 3 } }}>
            {/* Create New Tag Section */}
            <Card variant="outlined" sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Create New Tag</Typography>
                <Box component="form" onSubmit={handleCreateTag} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'flex-start', gap: 2 }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    label="New Tag Name"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter tag name"
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FaTag size={16} />
                        </InputAdornment>
                      ),
                    }}
                    error={!!tagError}
                    helperText={tagError || " "}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={!newTagName.trim() || (newTagName ? !validateTag(newTagName).valid : false) || status === 'loading'}
                    sx={{ 
                      height: '40px', 
                      whiteSpace: 'nowrap',
                      minWidth: { xs: '100%', sm: '130px' }
                    }}
                    startIcon={<FaPlus />}
                  >
                    Add Tag
                  </Button>
                </Box>
              </CardContent>
            </Card>
            
            {/* Manage Existing Tags Section */}
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">Manage Existing Tags</Typography>
                  <Chip 
                    label={`${filteredTags.length} tags`} 
                    color="primary" 
                    variant="outlined" 
                    size="small" 
                  />
                </Box>
                
                <Paper
                  component="form"
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    width: '100%', 
                    mb: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: 'none',
                    p: '2px 4px',
                  }}
                >
                  <InputAdornment position="start" sx={{ pl: 1 }}>
                    <FaSearch size={16} color="action" />
                  </InputAdornment>
                  <InputBase
                    sx={{ ml: 1, flex: 1 }}
                    placeholder="Search tags"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    inputProps={{ 'aria-label': 'search tags' }}
                  />
                  {searchTerm && (
                    <IconButton onClick={() => setSearchTerm('')} size="small" sx={{ color: 'text.secondary' }}>
                      <FaTimes size={14} />
                    </IconButton>
                  )}
                </Paper>
                
                {status === 'loading' ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress size={40} />
                  </Box>
                ) : filteredTags.length === 0 ? (
                  <Box sx={{ textAlign: 'center', p: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      {tags.length === 0 
                        ? "No tags found. Create your first tag to get started!" 
                        : "No tags match your search criteria."}
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Box sx={{ 
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(3, 1fr)',
                        lg: 'repeat(4, 1fr)',
                        xl: 'repeat(6, 1fr)'
                      },
                      gap: 1.5
                    }}>
                      {paginatedTags.map((tag) => (
                        <motion.div
                          key={tag._id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Paper
                            elevation={0}
                            sx={{
                              p: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              borderRadius: '8px',
                              border: '1px solid',
                              borderColor: 'divider',
                              transition: 'all 0.2s ease',
                              height: '36px',
                              '&:hover': {
                                bgcolor: alpha('#000', 0.03),
                                borderColor: 'primary.light',
                              }
                            }}
                          >
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1,
                                fontSize: '0.875rem',
                                pl: 0.5
                              }}
                            >
                              {tag.name}
                            </Typography>
                            <Stack direction="row" spacing={0.5}>
                              <IconButton
                                size="small"
                                onClick={() => setEditingTag({ id: tag._id, name: tag.name })}
                                sx={{ 
                                  color: 'primary.main', 
                                  p: 0.5,
                                  '&:hover': { bgcolor: alpha('#1976d2', 0.1) }
                                }}
                              >
                                <FaEdit size={14} />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => setTagToDelete(tag._id)}
                                sx={{ 
                                  color: 'error.main', 
                                  p: 0.5,
                                  '&:hover': { bgcolor: alpha('#d32f2f', 0.1) }
                                }}
                              >
                                <FaTrash size={14} />
                              </IconButton>
                            </Stack>
                          </Paper>
                        </motion.div>
                      ))}
                    </Box>
                    
                    {totalPages > 1 && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <Pagination 
                          count={totalPages} 
                          page={page} 
                          onChange={handleChangePage} 
                          color="primary" 
                          showFirstButton 
                          showLastButton
                          siblingCount={isMobile ? 0 : 1}
                        />
                      </Box>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </Box>
        </Paper>
      </Container>
      
      {/* Edit Dialog */}
      <Dialog 
        open={!!editingTag} 
        onClose={() => setEditingTag(null)}
        PaperProps={{
          sx: { borderRadius: '12px', maxWidth: '500px', width: '100%' }
        }}
      >
        <DialogTitle>Edit Tag</DialogTitle>
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
        <DialogTitle>Confirm Delete</DialogTitle>
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
