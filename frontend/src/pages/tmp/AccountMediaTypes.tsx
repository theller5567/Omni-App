import { useEffect, useState, useRef } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  AlertTitle,
  CircularProgress
} from '@mui/material';
import '../accountMediaTypes.scss';
import { motion } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import MediaTypeUploader from '../../components/MediaTypeUploader/MediaTypeUploader';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { 
  initializeMediaTypes, 
  checkMediaTypeUsage, 
  archiveMediaType,
  deleteMediaType,
  resetOperation,
  forceRefresh
} from '../../store/slices/mediaTypeSlice';
import { FaPlus, FaSync } from 'react-icons/fa';
import MediaTypeCard from '../../components/MediaTypeUploader/components/MediaTypeCard';

const AccountMediaTypes = () => {
  // State
  const [open, setOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [editMediaTypeId, setEditMediaTypeId] = useState<string | null>(null);
  const [selectedMediaTypeId, setSelectedMediaTypeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Refs
  const initialLoadAttemptedRef = useRef(false);
  const specificChecksRef = useRef(new Set<string>());
  
  // Redux
  const dispatch = useDispatch<AppDispatch>();
  const mediaTypesState = useSelector((state: RootState) => state.mediaTypes);
  const { mediaTypes, status } = mediaTypesState;
  const userRole = useSelector((state: RootState) => state.user.currentUser?.role);

  // Load media types on mount
  useEffect(() => {
    const loadMediaTypes = async () => {
      if (initialLoadAttemptedRef.current) {
        return;
      }

      initialLoadAttemptedRef.current = true;
      setIsLoading(true);
      
      try {
        await dispatch(forceRefresh());
        await dispatch(initializeMediaTypes()).unwrap();
        
        // Check specific types
        setTimeout(() => {
          updateSpecificMediaType('Application Note');
          updateSpecificMediaType('Protocol');
        }, 1000);
      } catch (error) {
        console.error('Error loading media types:', error);
        toast.error('Failed to load media types');
      } finally {
        setIsLoading(false);
      }
    };

    loadMediaTypes();
  }, [dispatch, refreshTrigger]);

  // Debug logging
  useEffect(() => {
    console.log('Media types state:', {
      count: mediaTypes.length,
      status,
      isLoading: status === 'loading'
    });
  }, [mediaTypes, status]);

  // Functions
  const updateSpecificMediaType = async (typeName: string) => {
    try {
      // Skip if already checked
      if (specificChecksRef.current.has(typeName)) {
        return;
      }
      
      // Find the media type
      const mediaType = mediaTypes.find(type => type.name === typeName);
      if (!mediaType) {
        console.log(`Media type "${typeName}" not found`);
        return;
      }
      
      console.log(`Checking count for media type: ${typeName} (${mediaType._id})`);
      await dispatch(checkMediaTypeUsage(mediaType._id));
      
      // Mark as completed
      specificChecksRef.current.add(typeName);
    } catch (error) {
      console.error(`Error updating "${typeName}" count:`, error);
    }
  };

  const refreshAllCounts = async () => {
    if (mediaTypes.length === 0) return;
    
    toast.info('Refreshing media type counts...');
    
    try {
      // Clear specific checks to allow re-checking
      specificChecksRef.current.clear();
      
      // Refresh each media type
      for (const mediaType of mediaTypes) {
        if (mediaType._id) {
          await dispatch(checkMediaTypeUsage(mediaType._id));
        }
      }
      
      toast.success('All media type counts updated');
    } catch (error) {
      console.error('Error refreshing counts:', error);
      toast.error('Error updating counts');
    }
  };

  const handleHardRefresh = async () => {
    setIsLoading(true);
    initialLoadAttemptedRef.current = false;
    specificChecksRef.current.clear();
    
    try {
      await dispatch(forceRefresh());
      await dispatch(initializeMediaTypes());
      toast.success('Media types reloaded');
      
      // Force re-running the effect
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error during hard refresh:', error);
      toast.error('Failed to reload media types');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (mediaTypeId: string) => {
    setEditMediaTypeId(mediaTypeId);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditMediaTypeId(null);
  };

  const handleDeleteClick = (mediaTypeId: string) => {
    setSelectedMediaTypeId(mediaTypeId);
    setConfirmDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedMediaTypeId) return;
    
    try {
      // Find selected media type
      const mediaType = mediaTypes.find(type => type._id === selectedMediaTypeId);
      if (!mediaType) return;
      
      // Check if it's in use
      await dispatch(checkMediaTypeUsage(selectedMediaTypeId));
      const usageCount = mediaType.usageCount || 0;
      
      if (usageCount > 0) {
        // Archive if in use
        await dispatch(archiveMediaType(selectedMediaTypeId));
        toast.success(`Media type "${mediaType.name}" archived (${usageCount} files using it)`);
      } else {
        // Delete if not in use
        await dispatch(deleteMediaType(selectedMediaTypeId));
        toast.success(`Media type "${mediaType.name}" deleted`);
      }
      
      // Reset and refresh
      setConfirmDialogOpen(false);
      setSelectedMediaTypeId(null);
      dispatch(resetOperation());
      
      // Force refresh
      initialLoadAttemptedRef.current = false;
      await dispatch(forceRefresh());
      await dispatch(initializeMediaTypes());
    } catch (error) {
      console.error('Error deleting/archiving media type:', error);
      toast.error('Operation failed');
      setConfirmDialogOpen(false);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDialogOpen(false);
    setSelectedMediaTypeId(null);
  };

  // Render loading state
  if (isLoading || status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading media types...
        </Typography>
      </Box>
    );
  }

  // Render empty state
  if (mediaTypes.length === 0) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <Typography variant="h6" gutterBottom>
          No media types found
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleHardRefresh}
          startIcon={<FaSync />}
          sx={{ mt: 2 }}
        >
          Reload Media Types
        </Button>
      </Box>
    );
  }

  // Main render
  return (
    <motion.div
      id="account-media-types"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.3 }}
    >
      <Box className="account-media-types" sx={{ width: "100%", overflow: "hidden" }}>
        <Typography variant="h1" align="left" sx={{ paddingBottom: "2rem" }}>
          Account Media Types
          <Typography variant="caption" sx={{ fontSize: '0.8rem', ml: 1, color: '#999' }}>
            ({mediaTypes.length} types)
          </Typography>
        </Typography>
        
        {/* Media Type Uploader Dialog */}
        <MediaTypeUploader 
          open={open} 
          onClose={handleClose} 
          editMediaTypeId={editMediaTypeId} 
        />
        
        {/* Header with actions */}
        <Box
          className="header-component"
          display="flex"
          flexWrap="wrap"
          alignItems="center"
          justifyContent="space-between"
          padding="1rem"
          bgcolor="var(--secondary-color)"
          mb={2}
        >
          <div className="media-types-container">
            <Typography variant="h5" align="left">
              Existing Media Types
              {userRole === 'superAdmin' ? (
                <Typography variant="caption" color="primary" sx={{ ml: 1 }}>
                  (Super Admin: Full control)
                </Typography>
              ) : (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  (Admin: Limited editing)
                </Typography>
              )}
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
              Status: {status} | Count: {mediaTypes.length}
            </Typography>
          </div>
          
          <div className="actions-container" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => setOpen(true)}
              startIcon={<FaPlus />}
            >
              Create New Media Type
            </Button>
            
            <Button
              variant="outlined"
              color="primary"
              onClick={refreshAllCounts}
              startIcon={<FaSync />}
            >
              Refresh Counts
            </Button>
            
            <Button
              variant="contained"
              color="error"
              onClick={handleHardRefresh}
            >
              Hard Refresh
            </Button>
          </div>
        </Box>
        
        {/* Media Type Grid */}
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
            gap: 2,
            mt: 2
          }}
        >
          {mediaTypes.map((mediaType) => (
            <Box 
              key={mediaType._id} 
              sx={{ 
                borderRadius: 1,
                padding: 2
              }}
            >
              <MediaTypeCard 
                mediaType={mediaType}
                onDelete={handleDeleteClick}
                onEdit={handleEditClick}
                onView={() => {}}
              />
              {mediaType.name === 'Application Note' && (
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  startIcon={<FaSync />}
                  onClick={() => updateSpecificMediaType('Application Note')}
                  sx={{ mt: 1, width: '100%' }}
                >
                  Update File Count
                </Button>
              )}
            </Box>
          ))}
        </Box>
      </Box>
      
      {/* Delete/Archive Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancelDelete}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">
          Media Type Management
        </DialogTitle>
        <DialogContent>
          {selectedMediaTypeId && (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <AlertTitle>Confirm Action</AlertTitle>
                You are about to modify or delete a media type. This action cannot be undone.
              </Alert>
              <Typography variant="body1">
                Do you want to proceed with this action? Media files using this type will be preserved.
              </Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      
      <ToastContainer position="top-right" />
    </motion.div>
  );
};

export default AccountMediaTypes; 