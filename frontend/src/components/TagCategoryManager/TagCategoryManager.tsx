import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
} from '../../store/slices/tagCategorySlice';
import { FaPlus } from 'react-icons/fa';
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

// Initial form data state to avoid recreating this object
const initialFormData: TagCategoryFormData = {
  name: '',
  description: '',
  tags: []
};

const TagCategoryManager: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { tagCategories, status, error: storeError } = useSelector((state: RootState) => state.tagCategories);
  
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TagCategory | null>(null);
  const [formData, setFormData] = useState<TagCategoryFormData>(initialFormData);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [hardDelete, setHardDelete] = useState(false);
  const [creationAttempted, setCreationAttempted] = useState(false);
  
  // Throttling reference
  const operationRef = useRef(false);
  
  // Fetch categories function (simplified)
  const fetchCategories = useCallback(async (showToast = false) => {
    if (operationRef.current) return;
    operationRef.current = true;
    
    try {
      console.log('Fetching tag categories');
      
      const result = await dispatch(fetchTagCategories()).unwrap();
      console.log('Tag categories fetch result:', result);
      
      if (result.length === 0 && creationAttempted) {
        console.log('Retrying tag categories fetch due to zero results');
        await dispatch(fetchTagCategories());
      }
      
      if (showToast && result.length > 0) {
        toast.success(`Successfully loaded ${result.length} tag categories`);
      }
      
      setTimeout(() => {
        operationRef.current = false;
      }, 800);
    } catch (err) {
      console.error('Error fetching tag categories:', err);
      if (showToast) {
        toast.error('Failed to load tag categories');
      }
      
      setTimeout(() => {
        operationRef.current = false;
      }, 800);
    }
  }, [dispatch, creationAttempted]);
  
  // Initial fetch on mount
  useEffect(() => {
    if (!operationRef.current) {
      fetchCategories();
    }
  }, [fetchCategories]);
  
  // Verification effect - only run when necessary
  useEffect(() => {
    if (creationAttempted && tagCategories.length === 0 && !operationRef.current) {
      console.log('Creation attempted but no categories found. Performing verification check...');
      const verifyCategories = async () => {
        try {
          operationRef.current = true;
          
          await dispatch(fetchTagCategories());
          
          setTimeout(() => {
            operationRef.current = false;
          }, 800);
        } catch (err) {
          console.error('Verification check failed:', err);
          
          setTimeout(() => {
            operationRef.current = false;
          }, 800);
        }
      };
      verifyCategories();
    }
  }, [creationAttempted, tagCategories.length, dispatch]);
  
  const handleOpen = useCallback((category?: TagCategory) => {
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
      setFormData(initialFormData);
    }
    setOpen(true);
  }, []);
  
  const handleClose = useCallback(() => {
    setOpen(false);
    // Delay resetting form data to prevent UI flicker
    setTimeout(() => {
      setEditingCategory(null);
      setFormData(initialFormData);
    }, 300);
  }, []);
  
  const handleDeleteClick = useCallback((id: string) => {
    setDeleteTarget(id);
    setHardDelete(false);
    setDeleteDialogOpen(true);
  }, []);
  
  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    
    try {
      operationRef.current = true;
      console.log(`Deleting tag category with ID: ${deleteTarget}, hard delete: ${hardDelete}`);
      
      await dispatch(deleteTagCategory({ id: deleteTarget, hardDelete })).unwrap();
      
      if (hardDelete) {
        toast.success('Tag category permanently deleted');
      } else {
        toast.success('Tag category deleted successfully (soft delete)');
      }
      
      // Update all states in a single batch to reduce renders
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      setHardDelete(false);
      
      // Fetch updated list
      await dispatch(fetchTagCategories());
      
      setTimeout(() => {
        operationRef.current = false;
      }, 800);
    } catch (error: any) {
      console.error('Error deleting tag category:', error);
      toast.error(typeof error === 'string' ? error : 'Failed to delete tag category');
      
      // Update all states in a single batch to reduce renders
      setTimeout(() => {
        operationRef.current = false;
      }, 800);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      setHardDelete(false);
    }
  }, [deleteTarget, hardDelete, dispatch]);
  
  const handleCancelDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
    setHardDelete(false);
  }, []);

  // Memoized function to check if category name exists
  const categoryNameExists = useCallback(async (name: string): Promise<boolean> => {
    // Use the existing categories in state if available - no need to refetch
    if (tagCategories.length > 0) {
      return tagCategories.some(cat => cat.name.toLowerCase() === name.toLowerCase());
    }
    
    try {
      const result = await dispatch(fetchTagCategories()).unwrap();
      return result.some(cat => cat.name.toLowerCase() === name.toLowerCase());
    } catch (err) {
      console.error('Error checking category existence:', err);
      return false;
    }
  }, [tagCategories, dispatch]);
  
  const handleSubmit = useCallback(async (submittedFormData: TagCategoryFormData) => {
    if (!submittedFormData.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    
    try {
      operationRef.current = true;
      console.log('Checking if category already exists:', submittedFormData.name);
      const exists = await categoryNameExists(submittedFormData.name);
      
      if (exists && !editingCategory) {
        operationRef.current = false;
        toast.error(`Category "${submittedFormData.name}" already exists. Please choose a different name.`);
        return;
      }
      
      if (exists && editingCategory && editingCategory.name.toLowerCase() !== submittedFormData.name.toLowerCase()) {
        operationRef.current = false;
        toast.error(`Category "${submittedFormData.name}" already exists. Please choose a different name.`);
        return;
      }
      
      setCreationAttempted(true);
      console.log('Submitting tag category with data:', submittedFormData);
      
      // Avoid unnecessary mapping when possible
      const transformedData = {
        name: submittedFormData.name,
        description: submittedFormData.description,
        tags: submittedFormData.tags
      };

      if (editingCategory) {
        await dispatch(updateTagCategory({ id: editingCategory._id, data: transformedData })).unwrap();
        toast.success(`Category "${submittedFormData.name}" updated successfully`);
      } else {
        await dispatch(createTagCategory(transformedData)).unwrap();
        toast.success(`Category "${submittedFormData.name}" created successfully`);
      }

      // Close the dialog first to improve perceived performance
      setOpen(false);
      
      // Then update the rest of the state and refetch
      setFormData(initialFormData);
      await dispatch(fetchTagCategories());
      
      setTimeout(() => {
        operationRef.current = false;
      }, 800);
    } catch (error: any) {
      console.error('Error submitting tag category:', error);
      
      if (error.message?.includes('already exists')) {
        toast.error(`Category "${submittedFormData.name}" already exists. Please choose a different name.`);
      } else {
        toast.error(`Failed to ${editingCategory ? 'update' : 'create'} category: ${error.message || 'Unknown error'}`);
      }
      
      setTimeout(() => {
        operationRef.current = false;
      }, 800);
    }
  }, [categoryNameExists, editingCategory, dispatch]);

  // Memoize the category name for the delete dialog to prevent unnecessary lookups
  const categoryNameToDelete = useMemo(() => 
    deleteTarget ? tagCategories.find(c => c._id === deleteTarget)?.name || '' : '',
    [deleteTarget, tagCategories]
  );

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
        <Button variant="outlined" onClick={() => fetchCategories()}>
          Try Again
        </Button>
      </Box>
    );
  }
  
  return (
    <Box className="tag-category-manager" sx={{ mt: 4 }}>
      {/* Header with action buttons - simplified */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Tag Categories</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<FaPlus />}
          onClick={() => handleOpen()}
          sx={{
            minWidth: '160px',
            height: '38px',
            transition: 'all 0.4s ease'
          }}
        >
          Create Category
        </Button>
      </Box>
      
      {/* Warning for creation attempts with no visible results */}
      {tagCategories.length === 0 && creationAttempted && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Category was created but isn't displaying. Try refreshing the page.
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
        categoryName={categoryNameToDelete}
      />
    </Box>
  );
};

export default TagCategoryManager;
