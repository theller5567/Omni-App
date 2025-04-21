import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import {
  fetchTagCategories,
  createTagCategory,
  updateTagCategory,
  deleteTagCategory,
  TagCategory,
  resetTagCategories,
  forceRefreshAllCategories
} from '../../store/slices/tagCategorySlice';
import { FaPlus, FaSync, FaRedo, FaBug } from 'react-icons/fa';
import { toast } from 'react-toastify';

// Import subcomponents
import { TagCategoryForm } from './TagCategoryForm';
import { TagCategoryItem } from './TagCategoryItem';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';

interface TagCategoryFormData {
  name: string;
  description: string;
  tags: Array<{ id: string; name: string }>;
}

const TagCategoryManager: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { tagCategories, status, error: storeError } = useSelector((state: RootState) => state.tagCategories);
  
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TagCategory | null>(null);
  const [formData, setFormData] = useState<TagCategoryFormData>({
    name: '',
    description: '',
    tags: []
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [hardDelete, setHardDelete] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [creationAttempted, setCreationAttempted] = useState(false);
  
  useEffect(() => {
    fetchCategories();
  }, [dispatch]);
  
  // Verify categories when errors occur
  useEffect(() => {
    if (creationAttempted && tagCategories.length === 0) {
      console.log('Creation attempted but no categories found. Performing verification check...');
      const verifyCategories = async () => {
        try {
          dispatch(resetTagCategories());
          await dispatch(fetchTagCategories());
        } catch (err) {
          console.error('Verification check failed:', err);
        }
      };
      verifyCategories();
    }
  }, [creationAttempted, tagCategories.length, dispatch]);
  
  const fetchCategories = async () => {
    try {
      setRefreshing(true);
      console.log('Fetching tag categories');
      
      dispatch(resetTagCategories());
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result = await dispatch(fetchTagCategories()).unwrap();
      console.log('Tag categories fetch result:', result);
      
      if (result.length === 0 && creationAttempted) {
        setTimeout(async () => {
          console.log('Retrying tag categories fetch due to zero results');
          await dispatch(fetchTagCategories());
          setRefreshing(false);
        }, 1000);
      } else {
        setRefreshing(false);
      }
    } catch (err) {
      console.error('Error fetching tag categories:', err);
      toast.error('Failed to load tag categories');
      setRefreshing(false);
    }
  };
  
  // Force reset caches and state
  const forceClearAndRefresh = async () => {
    try {
      setRefreshing(true);
      dispatch(resetTagCategories());
      console.log('Forcefully clearing cache and state');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const timestamp = new Date().getTime();
      console.log(`Re-fetching with fresh timestamp: ${timestamp}`);
      
      const result = await dispatch(fetchTagCategories()).unwrap();
      
      if (result.length > 0) {
        toast.success(`Successfully loaded ${result.length} tag categories`);
      } else {
        toast.info('No tag categories found in the database');
      }
      
      setRefreshing(false);
      setCreationAttempted(false);
    } catch (err) {
      console.error('Force refresh failed:', err);
      toast.error('Failed to reset and refresh tag categories');
      setRefreshing(false);
    }
  };
  
  // Force debug and reset function
  const forceDebugAndReset = async () => {
    try {
      setRefreshing(true);
      console.log('=== FORCE DEBUG AND RESET - STARTING DEEP CLEANUP ===');
      
      dispatch(resetTagCategories());
      toast.info('Force loading all categories including inactive ones...');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        const result = await dispatch(forceRefreshAllCategories()).unwrap();
        
        if (result.length > 0) {
          toast.success(`Loaded ${result.length} categories (including inactive)`);
          console.log('Force debug found categories:', result);
        } else {
          toast.warning('No categories found in database, even inactive ones');
        }
      } catch (err) {
        console.error('Force refresh failed:', err);
        toast.error('Failed to load all categories');
      }
      
      setRefreshing(false);
      setCreationAttempted(false);
      console.log('=== FORCE DEBUG AND RESET - COMPLETE ===');
    } catch (err) {
      console.error('Force debug failed:', err);
      toast.error('Force debug process failed');
      setRefreshing(false);
    }
  };
  
  const handleOpen = (category?: TagCategory) => {
    if (category) {
      setEditingCategory(category);
      const categoryTags = category.tags || [];
      
      setFormData({
        name: category.name,
        description: category.description || '',
        tags: categoryTags
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        tags: []
      });
    }
    setOpen(true);
  };
  
  const handleClose = () => {
    setOpen(false);
    setEditingCategory(null);
  };
  
  const handleDeleteClick = (id: string) => {
    setDeleteTarget(id);
    setHardDelete(false);
    setDeleteDialogOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    
    try {
      setRefreshing(true);
      console.log(`Deleting tag category with ID: ${deleteTarget}, hard delete: ${hardDelete}`);
      
      await dispatch(deleteTagCategory({ id: deleteTarget, hardDelete })).unwrap();
      
      if (hardDelete) {
        toast.success('Tag category permanently deleted');
      } else {
        toast.success('Tag category deleted successfully (soft delete)');
      }
      
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      setHardDelete(false);
      
      setTimeout(async () => {
        console.log('Refreshing tag categories after delete');
        await dispatch(fetchTagCategories());
        setRefreshing(false);
      }, 500);
    } catch (error: any) {
      console.error('Error deleting tag category:', error);
      toast.error(typeof error === 'string' ? error : 'Failed to delete tag category');
      setRefreshing(false);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      setHardDelete(false);
    }
  };
  
  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
    setHardDelete(false);
  };

  // Check if category name already exists
  const categoryNameExists = async (name: string): Promise<boolean> => {
    try {
      dispatch(resetTagCategories());
      const result = await dispatch(fetchTagCategories()).unwrap();
      return result.some(cat => cat.name.toLowerCase() === name.toLowerCase());
    } catch (err) {
      console.error('Error checking category existence:', err);
      return false;
    }
  };
  
  const handleSubmit = async (formData: TagCategoryFormData) => {
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    
    try {
      setRefreshing(true);
      console.log('Checking if category already exists:', formData.name);
      const exists = await categoryNameExists(formData.name);
      
      if (exists && !editingCategory) {
        setRefreshing(false);
        toast.error(`Category "${formData.name}" already exists. Please choose a different name.`);
        return;
      }
      
      if (exists && editingCategory && editingCategory.name.toLowerCase() !== formData.name.toLowerCase()) {
        setRefreshing(false);
        toast.error(`Category "${formData.name}" already exists. Please choose a different name.`);
        return;
      }
      
      setCreationAttempted(true);
      console.log('Submitting tag category with data:', formData);
      
      const processedTags = formData.tags.map(tag => ({
        id: tag.id,
        name: tag.name
      }));

      const transformedData = {
        name: formData.name,
        description: formData.description,
        tags: processedTags
      };

      if (editingCategory) {
        await dispatch(updateTagCategory({ id: editingCategory._id, data: transformedData })).unwrap();
        toast.success(`Category "${formData.name}" updated successfully`);
      } else {
        await dispatch(createTagCategory(transformedData)).unwrap();
        toast.success(`Category "${formData.name}" created successfully`);
      }

      setFormData({ name: '', description: '', tags: [] });
      setOpen(false);
      setRefreshing(false);
      await fetchCategories();
    } catch (error: any) {
      console.error('Error submitting tag category:', error);
      setRefreshing(false);
      
      if (error.message?.includes('already exists')) {
        toast.error(`Category "${formData.name}" already exists. Please choose a different name.`);
      } else {
        toast.error(`Failed to ${editingCategory ? 'update' : 'create'} category: ${error.message || 'Unknown error'}`);
      }
    }
  };

  if (status === 'loading' && tagCategories.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" padding={4}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (status === 'failed' && storeError) {
    return (
      <Box sx={{ mt: 2, mb: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {storeError}
        </Alert>
        <Button variant="outlined" onClick={fetchCategories}>
          Try Again
        </Button>
      </Box>
    );
  }
  
  return (
    <Box className="tag-category-manager" sx={{ mt: 4 }}>
      {/* Header with action buttons */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Tag Categories</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            color="warning"
            startIcon={<FaBug />}
            onClick={forceDebugAndReset}
            disabled={refreshing}
          >
            {refreshing ? 'Working...' : 'Force Reset & Debug'}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<FaRedo />}
            onClick={forceClearAndRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Resetting...' : 'Reset State'}
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<FaSync />}
            onClick={fetchCategories}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<FaPlus />}
            onClick={() => handleOpen()}
          >
            Create Category
          </Button>
        </Box>
      </Box>
      
      {/* Warning for creation attempts with no visible results */}
      {tagCategories.length === 0 && creationAttempted && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Category was created but isn't displaying. Try refreshing the page or clicking the Refresh button.
        </Alert>
      )}
      
      {/* Display tag categories or empty state */}
      {tagCategories.length === 0 ? (
        <Alert severity="info">No tag categories found. Create one to get started.</Alert>
      ) : (
        <Paper elevation={2}>
          <List>
            {tagCategories.map((category, index) => (
              <TagCategoryItem 
                key={category._id}
                category={category}
                index={index}
                totalCount={tagCategories.length}
                onEdit={() => handleOpen(category)}
                onDelete={() => handleDeleteClick(category._id)}
              />
            ))}
          </List>
        </Paper>
      )}
      
      {/* Form Dialog for creating/editing */}
      <TagCategoryForm
        open={open}
        formData={formData}
        setFormData={setFormData}
        onClose={handleClose}
        onSubmit={() => handleSubmit(formData)}
        isEditing={!!editingCategory}
      />
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        hardDelete={hardDelete}
        setHardDelete={setHardDelete}
        categoryName={deleteTarget ? tagCategories.find(c => c._id === deleteTarget)?.name || '' : ''}
      />
    </Box>
  );
};

export default TagCategoryManager;
