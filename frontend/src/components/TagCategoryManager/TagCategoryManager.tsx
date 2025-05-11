import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  Paper,
  Alert,
  CircularProgress
} from '@mui/material';
import { FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { 
  useTagCategories, 
  useCreateTagCategory, 
  useUpdateTagCategory, 
  useDeleteTagCategory,
  TagCategory as QueryTagCategory
} from '../../hooks/query-hooks';

// Lazy load subcomponents
const TagCategoryForm = lazy(() => import('./TagCategoryForm'));
const TagCategoryItem = lazy(() => import('./TagCategoryItem'));
const DeleteConfirmationDialog = lazy(() => import('./DeleteConfirmationDialog'));

// Match the interface in TagCategoryForm.tsx
interface TagCategoryFormData {
  name: string;
  description: string;
  tags: Array<{ id: string; name: string }>;
}

// Memoized initial form data
const initialFormData: TagCategoryFormData = {
  name: '',
  description: '',
  tags: []
};

// Loading fallback component
const LoadingFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" p={2}>
    <CircularProgress size={24} />
  </Box>
);

const TagCategoryManager: React.FC = () => {
  // Use TanStack Query hooks instead of Redux
  const { 
    data: tagCategories = [],
    isLoading,
    isError,
    error,
    refetch
  } = useTagCategories();
  
  const { mutateAsync: createTagCategoryMutation } = useCreateTagCategory();
  const { mutateAsync: updateTagCategoryMutation } = useUpdateTagCategory();
  const { mutateAsync: deleteTagCategoryMutation } = useDeleteTagCategory();
  
  // State management with useRef for values that don't affect rendering
  const operationInProgressRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  const toastShownRef = useRef<string[]>([]); // Changed from Set to array
  
  // Local state management
  const [dialogState, setDialogState] = useState({
    open: false,
    deleteDialogOpen: false,
    deleteTarget: null as string | null,
    hardDelete: false,
    editingCategory: null as QueryTagCategory | null,
    creationAttempted: false
  });
  
  // Use a separate state for form data to prevent re-renders of the entire component
  const [formData, setFormData] = useState<TagCategoryFormData>(initialFormData);
  // Add a flag to disable component-level toasts
  const [disableComponentToasts, setDisableComponentToasts] = useState(true);
  
  // Function to show toast only if not already shown for this operation
  const showToastOnce = useCallback((id: string, type: 'success' | 'error', message: string) => {
    // Only show component toast if not disabled
    if (!disableComponentToasts && !toastShownRef.current.includes(id)) { // Changed from Set.has to array includes
      // Use standard toast API
      toast[type](message);
      
      // Mark this toast as shown
      toastShownRef.current.push(id); // Changed from Set.add to array push
      
      // Clean up old toast IDs periodically (every 100 operations)
      if (toastShownRef.current.length > 100) {
        toastShownRef.current = [id];
      }
    }
  }, [disableComponentToasts]);
  
  // Component cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Dialog handlers with optimized state updates
  const handleOpen = useCallback((category: QueryTagCategory | null = null) => {
    setDialogState(prev => ({
      ...prev,
      open: true,
      editingCategory: category
    }));
    
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        tags: category.tags?.map(tag => ({
          id: (tag as any)._id || (tag as any).id || '',
          name: tag.name
        })) || []
      });
    } else {
      setFormData(initialFormData);
    }
  }, []);
  
  const handleClose = useCallback(() => {
    setDialogState(prev => ({
      ...prev,
      open: false
    }));
  }, []);
  
  const handleDeleteClick = useCallback((id: string) => {
    setDialogState(prev => ({
      ...prev,
      deleteDialogOpen: true,
      deleteTarget: id,
      hardDelete: false
    }));
  }, []);
  
  const handleCancelDelete = useCallback(() => {
    setDialogState(prev => ({
      ...prev,
      deleteDialogOpen: false
    }));
  }, []);
  
  const handleHardDeleteChange = useCallback((checked: boolean) => {
    setDialogState(prev => ({
      ...prev,
      hardDelete: checked
    }));
  }, []);
  
  const handleConfirmDelete = useCallback(async () => {
    const { deleteTarget, hardDelete } = dialogState;
    if (!deleteTarget || operationInProgressRef.current) return;
    
    try {
      operationInProgressRef.current = true;
      
      // Find category name before deletion
      const categoryToDelete = tagCategories.find(c => c._id === deleteTarget);
      const categoryName = categoryToDelete?.name || 'Category';
      
      // Delete using the TanStack Query mutation
      await deleteTagCategoryMutation(deleteTarget);
      
      // Generate unique ID for this toast
      const toastId = `delete-${deleteTarget}-${Date.now()}`;
      
      // Success message based on delete type
      if (hardDelete) {
        showToastOnce(toastId, 'success', `${categoryName} has been permanently deleted`);
      } else {
        showToastOnce(toastId, 'success', `${categoryName} has been moved to inactive categories`);
      }
      
      // Close dialog
      setDialogState(prev => ({
        ...prev,
        deleteDialogOpen: false,
        deleteTarget: null,
        hardDelete: false
      }));
    } catch (error: any) {
      console.error('Error deleting tag category:', error);
      const errorId = `delete-error-${dialogState.deleteTarget}-${Date.now()}`;
      showToastOnce(errorId, 'error', `Failed to delete category: ${error.message || 'Unknown error'}`);
    } finally {
      operationInProgressRef.current = false;
    }
  }, [dialogState, tagCategories, showToastOnce, deleteTagCategoryMutation]);
  
  // Check if category name exists
  const categoryNameExists = useCallback((name: string): boolean => {
    return tagCategories.some(cat => 
      cat.name.toLowerCase() === name.toLowerCase()
    );
  }, [tagCategories]);
  
  // Handle form submission
  const handleSubmit = useCallback(async (submittedFormData: TagCategoryFormData) => {
    if (!submittedFormData.name.trim()) {
      const errorId = `empty-name-error-${Date.now()}`;
      showToastOnce(errorId, 'error', 'Category name is required');
      return;
    }
    
    if (operationInProgressRef.current) return;
    
    const { editingCategory } = dialogState;
    
    try {
      operationInProgressRef.current = true;
      
      // Check for duplicate name
      const exists = categoryNameExists(submittedFormData.name);
      const isEditingSameName = editingCategory && 
        editingCategory.name.toLowerCase() === submittedFormData.name.toLowerCase();
      
      if (exists && (!editingCategory || !isEditingSameName)) {
        const errorId = `duplicate-name-${submittedFormData.name}-${Date.now()}`;
        showToastOnce(errorId, 'error', `Category "${submittedFormData.name}" already exists. Please choose a different name.`);
        return;
      }
      
      setDialogState(prev => ({
        ...prev,
        creationAttempted: true
      }));
      
      // Prepare data for API
      const transformedData = {
        name: submittedFormData.name,
        description: submittedFormData.description,
        tags: submittedFormData.tags.map(tag => ({
          id: tag.id,
          name: tag.name
        }))
      };
      
      let result;
      if (editingCategory) {
        // Update using TanStack Query mutation
        result = await updateTagCategoryMutation({ 
          id: editingCategory._id, 
          updates: transformedData 
        });
        const successId = `update-${editingCategory._id}-${Date.now()}`;
        showToastOnce(successId, 'success', `Category "${submittedFormData.name}" updated successfully`);
      } else {
        // Create using TanStack Query mutation
        result = await createTagCategoryMutation(transformedData);
        const successId = `create-${result._id}-${Date.now()}`;
        showToastOnce(successId, 'success', `Category "${submittedFormData.name}" created successfully`);
      }
      
      // Close dialog and reset state
      setDialogState(prev => ({
        ...prev,
        open: false,
        editingCategory: null
      }));
      
      setFormData(initialFormData);
    } catch (error: any) {
      console.error('Error submitting tag category:', error);
      
      // Handle authentication error
      if (error.includes && error.includes('Invalid token') || 
          (error.response && error.response.status === 401)) {
        const authErrorId = `auth-error-${Date.now()}`;
        showToastOnce(authErrorId, 'error', 'Your session has expired. Please sign in again.');
        // Redirect to login page
        window.location.href = '/login';
        return;
      }
      
      const errorId = `submit-error-${Date.now()}`;
      if (error.message?.includes('already exists')) {
        showToastOnce(errorId, 'error', `Category "${submittedFormData.name}" already exists. Please choose a different name.`);
      } else {
        showToastOnce(errorId, 'error', `Failed to ${editingCategory ? 'update' : 'create'} category: ${error.message || 'Unknown error'}`);
      }
    } finally {
      operationInProgressRef.current = false;
    }
  }, [dialogState, categoryNameExists, showToastOnce, createTagCategoryMutation, updateTagCategoryMutation]);
  
  // Memoized derived state
  const isEmpty = useMemo(() => 
    tagCategories.length === 0, 
    [tagCategories.length]
  );
  
  const categoryNameToDelete = useMemo(() => 
    dialogState.deleteTarget ? 
      tagCategories.find(c => c._id === dialogState.deleteTarget)?.name || '' : 
      '', 
    [dialogState.deleteTarget, tagCategories]
  );
  
  // Render loading state
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" padding={4}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Render error state
  if (isError) {
    return (
      <Box sx={{ mt: 2, mb: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error instanceof Error ? error.message : 'Failed to load tag categories'}
        </Alert>
        <Button variant="outlined" onClick={() => refetch()}>
          Try Again
        </Button>
      </Box>
    );
  }
  
  return (
    <Box className="tag-category-manager" sx={{ mt: 4 }}>
      {/* Header with action buttons */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h5">Tag Categories</Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<FaPlus />}
          onClick={() => handleOpen()}
          sx={{
            minWidth: '160px',
            height: '38px'
          }}
        >
          Create Category
        </Button>
      </Box>
      
      {/* Warning for creation attempts with no visible results */}
      {isEmpty && dialogState.creationAttempted && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Category was created but isn't displaying. Try refreshing the page.
        </Alert>
      )}
      
      {/* Display tag categories or empty state */}
      {isEmpty ? (
        <Alert severity="info">No tag categories found. Create one to get started.</Alert>
      ) : (
        <Paper elevation={2}>
          <List>
            {tagCategories.map((category, index) => (
              <Suspense key={category._id} fallback={<LoadingFallback />}>
                <TagCategoryItem 
                  category={category}
                  index={index}
                  totalCount={tagCategories.length}
                  onEdit={() => handleOpen(category)}
                  onDelete={() => handleDeleteClick(category._id)}
                />
              </Suspense>
            ))}
          </List>
        </Paper>
      )}
      
      {/* Conditionally render dialogs only when needed */}
      {dialogState.open && (
        <Suspense fallback={<LoadingFallback />}>
          <TagCategoryForm
            open={dialogState.open}
            formData={formData}
            setFormData={setFormData}
            onClose={handleClose}
            onSubmit={() => handleSubmit(formData)}
            isEditing={!!dialogState.editingCategory}
          />
        </Suspense>
      )}
      
      {dialogState.deleteDialogOpen && (
        <Suspense fallback={<LoadingFallback />}>
          <DeleteConfirmationDialog
            open={dialogState.deleteDialogOpen}
            onClose={handleCancelDelete}
            onConfirm={handleConfirmDelete}
            hardDelete={dialogState.hardDelete}
            setHardDelete={handleHardDeleteChange}
            categoryName={categoryNameToDelete}
          />
        </Suspense>
      )}
    </Box>
  );
};

export default React.memo(TagCategoryManager);
