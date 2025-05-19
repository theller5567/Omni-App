import React, { useState, useMemo, useCallback } from "react";
import TagCategoryManager from "../components/TagCategoryManager/TagCategoryManager";
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { 
  useTagCategories,
  useUserProfile,
  useTags,
  useCreateTag
} from "../hooks/query-hooks";
import type { User, Tag } from "../hooks/query-hooks";

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
  // --- User Profile ---
  const { 
    data: userProfile, 
    isLoading: isLoadingUserProfile, 
    isError: isUserProfileError 
  } = useUserProfile();

  // Replace Redux with TanStack Query
  const { 
    data: tags = [] as any[], // Temporarily any
    isLoading: isTagsLoading,
    isError: isTagsError, // Temporarily any
    refetch: refetchTags // This is where refetchTags comes from
  } = useTags(userProfile); // useTags(userProfile) - Temporarily using {} as useTags is not implemented
  
  const {
    data: tagCategories = [],
    isLoading: isCategoriesLoading,
    refetch: refetchCategories
  } = useTagCategories(userProfile);
  
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

  // Get the mutation function from useCreateTag
  const { mutate: createTagMutation, isPending: isCreatingTag } = useCreateTag();

  // --- Top-level Loading and Auth Checks ---
  if (isLoadingUserProfile) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading user information...</Typography>
      </Container>
    );
  }

  if (isUserProfileError || !userProfile) {
    return (
      <Container sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh', textAlign: 'center' }}>
        <Typography variant="h5" color="textSecondary" gutterBottom>
          {isUserProfileError ? 'Error Loading Profile' : 'Access Denied'}
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
          {isUserProfileError ? 'Could not load your profile. Please try again later.' : 'Please log in to manage tags.'}
        </Typography>
        <Button variant="contained" onClick={() => window.location.href = '/login'}>
          Go to Login
        </Button>
      </Container>
    );
  }
  // --- End Top-level Loading and Auth Checks ---

  // Combine loading states
  const isLoading = useMemo(() => 
    isTagsLoading || 
    isCategoriesLoading || 
    isResetting || 
    isRefreshing ||
    isCreatingTag,
  [isTagsLoading, isCategoriesLoading, isResetting, isRefreshing, isCreatingTag]);

  // Memoized value for total tag count
  const totalTagCount = useMemo(() => tags.length, [tags]);

  // Fetch data function to refresh both tags and categories
  const fetchData = useCallback(async (force = false) => {
    if (isLoading && !force) return;
    
    try {
      setIsRefreshing(true);
      // Only call refetchTags if it's a function (i.e., useTags is implemented)
      // For now, we will only refetch categories as useTags is a placeholder.
      await Promise.all([
        typeof refetchTags === 'function' ? refetchTags() : Promise.resolve(),
        refetchCategories()
      ]);
    } catch (error) {
      console.error('Error fetching tag data:', error);
      // Avoid showing toast if the error is due to refetchTags not being a function
      if (!(error instanceof TypeError && error.message.includes('refetchTags is not a function'))) {
        toast.error('Error refreshing data.');
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [isLoading, refetchTags, refetchCategories]); // Removed refetchTags from dependencies for now

  // Tag validation logic
  const validateNewTag = useCallback((tagName: string) => {
    if (!tagName) return null;
    
    const validation = validateTag(tagName);
    
    // Check for duplicate tags (case-insensitive)
    if (validation.valid && (tags as any[]).some((tag: any) => 
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
    if (!newTagName.trim() || !!tagError || isCreatingTag) {
      if (tagError) {
        toast.error(tagError);
      }
      return;
    }
    createTagMutation(normalizeTag(newTagName), {
      onSuccess: () => {
        setNewTagName("");
      },
    });
  }, [newTagName, tagError, isCreatingTag, createTagMutation]);

  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleCreateTag(event);
    }
  }, [handleCreateTag]);

  const handleDeleteTag = useCallback(async () => {
    toast.info("Tag deletion is temporarily disabled.");
    setTagToDelete(null);
  }, []);

  const handleUpdateTag = useCallback(async () => {
    toast.info("Tag update is temporarily disabled.");
    setEditingTag(null);
  }, []);

  // Memoized filtered tags to prevent recalculation on each render
  const filteredTags = useMemo(() => {
    return (tags as any[]).filter((tag: any) =>
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
                      {paginatedTags.map((tag: any) => (
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
              {tags.find((tag: any) => tag._id === tagToDelete)?.name || 'Unknown Tag'}
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
