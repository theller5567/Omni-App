import { useEffect, useState, useRef, createContext, useContext } from 'react';
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
import './accountMediaTypes.scss';
import { motion } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import MediaTypeUploader from '../components/MediaTypeUploader/MediaTypeUploader';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { 
  checkMediaTypeUsage, 
  archiveMediaType,
  deleteMediaType,
  resetOperation,
  forceRefresh,
  MediaType,
  fetchMediaTypesWithUsageCounts
} from '../store/slices/mediaTypeSlice';
import { FaPlus, FaSync } from 'react-icons/fa';
import MediaTypeCard from '../components/MediaTypeUploader/components/MediaTypeCard';

// Context type definition
type MediaTypesContextType = {
  mediaTypes: MediaType[];
  status: string;
  isLoading: boolean;
  userRole: string | undefined;
  updateMediaTypeCount: (typeName: string) => Promise<void>;
  refreshAllCounts: () => Promise<void>;
  handleEditClick: (mediaTypeId: string) => void;
  handleDeleteClick: (mediaTypeId: string) => void;
  handleHardRefresh: () => Promise<void>;
  handleRefreshCounts: () => Promise<void>;
  dispatch: AppDispatch;
};

// Create context
const MediaTypesContext = createContext<MediaTypesContextType | undefined>(undefined);

// Custom hook to use context
const useMediaTypesContext = () => {
  const context = useContext(MediaTypesContext);
  if (!context) {
    throw new Error('useMediaTypesContext must be used within a MediaTypesProvider');
  }
  return context;
};

// Separate Loading State Component
const LoadingState = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
    <CircularProgress />
    <Typography variant="h6" sx={{ ml: 2 }}>
      Loading media types...
    </Typography>
  </Box>
);

// Empty State Component
const EmptyState = ({ onRefresh }: { onRefresh: () => void }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
    <Typography variant="h6" gutterBottom>
      No media types found
    </Typography>
    <Button
      variant="contained"
      color="primary"
      onClick={onRefresh}
      startIcon={<FaSync />}
      sx={{ mt: 2 }}
    >
      Reload Media Types
    </Button>
  </Box>
);

// Header Component
const Header = () => {
  const { mediaTypes } = useMediaTypesContext();
  
  return (
    <Typography variant="h1" align="left" sx={{ paddingBottom: "2rem" }}>
      Account Media Types
      <Typography variant="caption" sx={{ fontSize: '0.8rem', ml: 1, color: '#999' }}>
        ({mediaTypes.length} types)
      </Typography>
    </Typography>
  );
};

// Action Bar Component
const ActionBar = () => {
  const { 
    status, 
    mediaTypes, 
    userRole, 
    handleRefreshCounts, 
    handleHardRefresh, 
    handleEditClick 
  } = useMediaTypesContext();
  
  return (
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
          onClick={() => handleEditClick('')}
          startIcon={<FaPlus />}
        >
          Create New Media Type
        </Button>
        
        <Button
          variant="outlined"
          color="primary"
          onClick={handleRefreshCounts}
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
  );
};

// Media Type Item Component
const MediaTypeItem = ({ 
  mediaType, 
  onEdit, 
  onDelete
}: { 
  mediaType: MediaType, 
  onEdit: (id: string) => void, 
  onDelete: (id: string) => void
}) => {
  return (
    <Box 
      sx={{ 
        borderRadius: 1,
        padding: 2
      }}
    >
      <MediaTypeCard 
        mediaType={mediaType}
        onDelete={onDelete}
        onEdit={onEdit}
        onView={() => {}}
      />
    </Box>
  );
};

// Media Type Grid Component
const MediaTypeGrid = () => {
  const { mediaTypes, handleEditClick, handleDeleteClick } = useMediaTypesContext();
  
  return (
    <Box 
      sx={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: 2,
        mt: 2
      }}
    >
      {mediaTypes.map((mediaType) => (
        <MediaTypeItem 
          key={mediaType._id}
          mediaType={mediaType}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      ))}
    </Box>
  );
};

// Delete Dialog Component
const DeleteDialog = ({ 
  open, 
  onClose, 
  onConfirm, 
  selectedId 
}: { 
  open: boolean, 
  onClose: () => void, 
  onConfirm: () => void, 
  selectedId: string | null 
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="delete-dialog-title"
    >
      <DialogTitle id="delete-dialog-title">
        Media Type Management
      </DialogTitle>
      <DialogContent>
        {selectedId && (
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
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Main component that serves as the provider
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

  // Load media types with usage counts on mount - optimized to fetch all data in one go
  useEffect(() => {
    const loadMediaTypes = async () => {
      if (initialLoadAttemptedRef.current) {
        return;
      }

      initialLoadAttemptedRef.current = true;
      setIsLoading(true);
      
      try {
        // Reset any existing data first
        await dispatch(forceRefresh());
        
        // Use the optimized fetch that gets media types with usage counts in one go
        await dispatch(fetchMediaTypesWithUsageCounts()).unwrap();
        
        console.log('All media types loaded with usage counts');
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
  }, [mediaTypes.length, status]);

  // Single media type update function - only used for manual refreshes
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
      
      console.log(`Manually refreshing count for media type: ${typeName} (${mediaType._id})`);
      await dispatch(checkMediaTypeUsage(mediaType._id));
      
      // Mark as completed
      specificChecksRef.current.add(typeName);
    } catch (error) {
      console.error(`Error updating "${typeName}" count:`, error);
    }
  };

  // Manual refresh of all counts - only when requested by user
  const refreshAllCounts = async () => {
    if (mediaTypes.length === 0) return;
    
    toast.info('Refreshing media type counts...');
    
    try {
      // Clear specific checks to allow re-checking
      specificChecksRef.current.clear();
      
      // Use the optimized fetch to refresh all media types with usage counts in one go
      await dispatch(fetchMediaTypesWithUsageCounts()).unwrap();
      
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
      await dispatch(fetchMediaTypesWithUsageCounts()).unwrap();
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
      
      // Refresh all media types
      await dispatch(forceRefresh());
      await dispatch(fetchMediaTypesWithUsageCounts()).unwrap();
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

  // Handle manual refresh
  const handleRefreshCounts = async () => {
    await refreshAllCounts();
  };

  // Prepare context value
  const contextValue: MediaTypesContextType = {
    mediaTypes,
    status,
    isLoading: isLoading || status === 'loading',
    userRole,
    updateMediaTypeCount: updateSpecificMediaType,
    refreshAllCounts,
    handleEditClick,
    handleDeleteClick,
    handleHardRefresh,
    handleRefreshCounts,
    dispatch
  };

  // Render loading state
  if (isLoading || status === 'loading') {
    return <LoadingState />;
  }

  // Render empty state
  if (mediaTypes.length === 0) {
    return <EmptyState onRefresh={handleHardRefresh} />;
  }

  // Main render
  return (
    <MediaTypesContext.Provider value={contextValue}>
      <motion.div
        id="account-media-types"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{ duration: 0.3 }}
      >
        <Box className="account-media-types" sx={{ width: "100%", overflow: "hidden" }}>
          <Header />

          {/* Media Type Uploader Dialog */}
          <MediaTypeUploader 
            open={open} 
            onClose={handleClose} 
            editMediaTypeId={editMediaTypeId} 
          />
          
          {/* Main content */}
          <ActionBar />
          <MediaTypeGrid />
        </Box>

        {/* Delete/Archive Confirmation Dialog */}
        <DeleteDialog
          open={confirmDialogOpen}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          selectedId={selectedMediaTypeId}
        />
        
        <ToastContainer position="top-right" />
      </motion.div>
    </MediaTypesContext.Provider>
  );
};

export default AccountMediaTypes;