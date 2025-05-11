import React, { useState, useMemo, useCallback } from "react";
import TagCategoryManager from "../components/TagCategoryManager/TagCategoryManager";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { 
  useTags, 
  useCreateTag, 
  useUpdateTag, 
  useDeleteTag, 
  useTagCategories
} from "../hooks/query-hooks";

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
  alpha,
  LinearProgress
} from "@mui/material";
import { FaEdit, FaTrash, FaPlus, FaSearch, FaTimes, FaTag, FaRedo } from "react-icons/fa";
import { motion } from "framer-motion";
import { normalizeTag, normalizeTagForComparison, validateTag, areTagsEquivalent } from "../utils/tagUtils";
import "./accountTags.scss";

const TAGS_PER_PAGE = 30;

const AccountTags: React.FC = () => {
  // Replace Redux with TanStack Query
  const { 
    data: tags = [], 
    isLoading: isTagsLoading,
    isError: isTagsError,
    refetch: refetchTags
  } = useTags();
  
  const {
    data: tagCategories = [],
    isLoading: isCategoriesLoading,
    refetch: refetchCategories
  } = useTagCategories();
  
  const { mutateAsync: createTag } = useCreateTag();
  const { mutateAsync: updateTagMutation } = useUpdateTag();
  const { mutateAsync: deleteTagMutation } = useDeleteTag();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [editingTag, setEditingTag] = useState<{ id: string; name: string } | null>(null);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  const [tagError, setTagError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLocalToasts, setShowLocalToasts] = useState(false);

  // Combine loading states
  const isLoading = useMemo(() => 
    isTagsLoading || 
    isCategoriesLoading || 
    isResetting || 
    isRefreshing, 
  [isTagsLoading, isCategoriesLoading, isResetting, isRefreshing]);

  // Memoized value for total tag count
  const totalTagCount = useMemo(() => tags.length, [tags]);

  // Fetch data function to refresh both tags and categories
  const fetchData = useCallback(async (force = false) => {
    if (isLoading && !force) return;
    
    try {
      setIsRefreshing(true);
      await Promise.all([
        refetchTags(),
        refetchCategories()
      ]);
    } catch (error) {
      console.error('Error fetching tag data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isLoading, refetchTags, refetchCategories]);

  // Tag validation logic
  const validateNewTag = useCallback((tagName: string) => {
    if (!tagName) return null;
    
    const validation = validateTag(tagName);
    
    // Check for duplicate tags (case-insensitive)
    if (validation.valid && tags.some(tag => 
      areTagsEquivalent(tag.name, tagName)
    )) {
      return `Tag "${tagName}" already exists`;
    } 
    
    return validation.valid ? null : validation.message || null;
  }, [tags]);

  // Update tag error when tag name changes
  React.useEffect(() => {
    setTagError(validateNewTag(newTagName));
  }, [newTagName, validateNewTag]);

  // Reset tag data function
  const handleResetData = async () => {
    if (isResetting) return;
    
    try {
      setIsResetting(true);
      
      // Refresh data with force flag
      await fetchData(true);
      
      toast.success('Tag data refreshed successfully');
    } catch (err) {
      console.error('Failed to refresh data:', err);
      toast.error('Failed to refresh tag data');
    } finally {
      setIsResetting(false);
    }
  };

  // Create tag handler - using memoized validation
  const handleCreateTag = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim() || tagError) return;
    
    // Final validation check
    const validation = validateTag(newTagName);
    if (!validation.valid) {
      setTagError(validation.message || 'Invalid tag');
      return;
    }
    
    // Check for duplicates
    if (tags.some(tag => areTagsEquivalent(tag.name, newTagName))) {
      setTagError(`Tag "${newTagName}" already exists`);
      return;
    }
    
    try {
      await createTag(normalizeTag(newTagName));
      setNewTagName("");
      if (showLocalToasts) {
        toast.success('Tag created successfully');
      }
    } catch (error: any) {
      // Always show error toasts, even if success toasts are disabled
      toast.error(`Failed to create tag: ${error?.message || 'Unknown error'}`);
    }
  }, [createTag, newTagName, tagError, tags, showLocalToasts]);

  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleCreateTag(event);
    }
  }, [handleCreateTag]);

  const handleDeleteTag = useCallback(async () => {
    if (!tagToDelete) return;
    
    try {
      await deleteTagMutation(tagToDelete);
      if (showLocalToasts) {
        toast.success('Tag deleted successfully');
      }
      setTagToDelete(null);
    } catch (error: any) {
      console.error('Failed to delete tag:', error);
      toast.error(`Failed to delete tag: ${error?.message || 'Unknown error'}`);
      setTagToDelete(null);
    }
  }, [deleteTagMutation, tagToDelete, showLocalToasts]);

  const handleUpdateTag = useCallback(async () => {
    if (!editingTag || !editingTag.name.trim()) return;
    
    const validation = validateTag(editingTag.name);
    if (!validation.valid) {
      toast.error(validation.message || 'Invalid tag name');
      return;
    }
    
    // Skip update if name hasn't changed
    const originalTag = tags.find(t => t._id === editingTag.id);
    if (originalTag && originalTag.name === editingTag.name) {
      setEditingTag(null);
      return;
    }
    
    // Check for duplicates, but exclude current tag from the check
    const hasDuplicate = tags.some(tag => 
      tag._id !== editingTag.id && 
      areTagsEquivalent(tag.name, editingTag.name)
    );
    
    if (hasDuplicate) {
      toast.error(`Tag "${editingTag.name}" already exists`);
      return;
    }
    
    try {
      await updateTagMutation({
        id: editingTag.id,
        name: normalizeTag(editingTag.name)
      });
      
      if (showLocalToasts) {
        toast.success('Tag updated successfully');
      }
      setEditingTag(null);
    } catch (error: any) {
      toast.error(`Failed to update tag: ${error?.message || 'Unknown error'}`);
    }
  }, [updateTagMutation, editingTag, tags, showLocalToasts]);

  // Memoized filtered tags to prevent recalculation on each render
  const filteredTags = useMemo(() => {
    return tags.filter((tag) =>
      normalizeTagForComparison(tag.name).includes(normalizeTagForComparison(searchTerm))
    );
  }, [tags, searchTerm]);

  // Pagination logic
  const totalPages = Math.ceil(filteredTags.length / TAGS_PER_PAGE);
  const paginatedTags = useMemo(() => {
    const startIndex = (page - 1) * TAGS_PER_PAGE;
    return filteredTags.slice(startIndex, startIndex + TAGS_PER_PAGE);
  }, [filteredTags, page]);

  const handleChangePage = useCallback((_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  }, []);

  const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  }, []);

  // Clear search handler
  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setPage(1); // Reset to first page when search changes
  }, []);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: 20, transition: { duration: 0.3 } },
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
            startIcon={isResetting ? <CircularProgress size={16} color="inherit" /> : <FaRedo />}
            onClick={handleResetData}
            disabled={isLoading}
            size="small"
            sx={{ height: '36px' }}
          >
            {isResetting ? 'Refreshing...' : 'Refresh Tags'}
          </Button>
        </Box>
        
        {isLoading && (
          <Box sx={{ width: '100%', mb: 3 }}>
            <LinearProgress />
          </Box>
        )}

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
                    disabled={!newTagName.trim() || !!tagError || isLoading}
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      label={`${filteredTags.length} tags`} 
                      color="primary" 
                      variant="outlined" 
                      size="small" 
                    />
                    <IconButton 
                      onClick={() => fetchData(true)}
                      size="small"
                      disabled={isLoading}
                      title="Refresh tags"
                    >
                      <FaRedo size={14} />
                    </IconButton>
                  </Box>
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
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      if (page !== 1) setPage(1);  // Reset to first page on search
                    }}
                    inputProps={{ 'aria-label': 'search tags' }}
                  />
                  {searchTerm && (
                    <IconButton onClick={handleClearSearch} size="small" sx={{ color: 'text.secondary' }}>
                      <FaTimes size={14} />
                    </IconButton>
                  )}
                </Paper>
                
                {isLoading ? (
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
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <IconButton 
                                size="small" 
                                onClick={() => setEditingTag({ id: tag._id, name: tag.name })}
                                sx={{ fontSize: '0.75rem' }}
                              >
                                <FaEdit size={14} />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                color="error" 
                                onClick={() => setTagToDelete(tag._id)}
                                sx={{ fontSize: '0.75rem' }}
                              >
                                <FaTrash size={14} />
                              </IconButton>
                            </Box>
                          </Paper>
                        </motion.div>
                      ))}
                    </Box>
                    
                    {totalPages > 1 && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <Pagination 
                          count={totalPages} 
                          page={page} 
                          onChange={handleChangePage} 
                          color="primary" 
                          size={isMobile ? "small" : "medium"}
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
      
      {/* Edit Tag Dialog */}
      <Dialog open={!!editingTag} onClose={() => setEditingTag(null)}>
        <DialogTitle>Edit Tag</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tag Name"
            type="text"
            fullWidth
            variant="outlined"
            value={editingTag?.name || ''}
            onChange={(e) => setEditingTag(prev => prev ? { ...prev, name: e.target.value } : null)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingTag(null)}>Cancel</Button>
          <Button onClick={handleUpdateTag} variant="contained" color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!tagToDelete} onClose={() => setTagToDelete(null)}>
        <DialogTitle>Delete Tag</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this tag?
            This action cannot be undone.
          </Typography>
          {tagToDelete && (
            <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>
              {tags.find(tag => tag._id === tagToDelete)?.name || 'Unknown Tag'}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTagToDelete(null)}>Cancel</Button>
          <Button onClick={handleDeleteTag} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
};

export default AccountTags;
