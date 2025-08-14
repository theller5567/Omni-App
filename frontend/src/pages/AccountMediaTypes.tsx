import { useState } from 'react';
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
import { toast } from 'react-toastify';
import MediaTypeUploader from '../components/MediaTypeUploader/MediaTypeUploader';
import { FaPlus, FaSync } from 'react-icons/fa';
import MediaTypeCard from '../components/MediaTypeUploader/components/MediaTypeCard';
import { 
  useMediaTypesWithUsageCounts,
  useDeleteMediaType,
  useArchiveMediaType,
  useCheckMediaTypeUsage,
  MediaType,
  useUserProfile,
} from '../hooks/query-hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@mui/material/styles';

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
  return (
    <Typography variant="h1" align="left" sx={{ paddingBottom: "2rem" }}>
      Account Media Types
    </Typography>
  );
};

// Action Bar Component
const ActionBar = ({ 
  mediaTypes,
  userRole,
  onRefresh,
  onCreateNew
}: { 
  mediaTypes: MediaType[],
  userRole: string | undefined,
  onRefresh: () => void,
  onCreateNew: () => void
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  return (
    <Box
      className="header-component"
      display="flex"
      flexWrap="wrap"
      alignItems="center"
      justifyContent="space-between"
      padding="1rem"
      borderRadius={1}
      bgcolor={isDarkMode ? 'var(--color-surface-elevated)' : 'var(--color-surface-gradient-light)'}
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
          Count: {mediaTypes.length}
        </Typography>
      </div>
      
      <Box className="actions-container" sx={{ display: 'flex', gap: 1, mt: 1, width: '100%', flexDirection: { xs: 'column', sm: 'row' } }}>
        <Button
          variant="contained"
          color="secondary"
          onClick={onCreateNew}
          startIcon={<FaPlus />}
          disabled={userRole !== 'superAdmin'}
          sx={{ width: { xs: '100%', sm: 'auto' }, flex: { sm: 'initial' }, mb: { xs: 2, sm: 0 }, mt: { xs: 2, sm: 2 } }}
        >
          Create New Media Type
        </Button>
        
        <Button
          variant="outlined"
          color="primary"
          onClick={onRefresh}
          startIcon={<FaSync />}
          sx={{ width: { xs: '100%', sm: 'auto' }, flex: { sm: 'initial' }, mt: { xs: 2, sm: 2 } }}
        >
          Refresh
        </Button>
      </Box>
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
const MediaTypeGrid = ({
  mediaTypes,
  onEdit,
  onDelete
}: {
  mediaTypes: MediaType[],
  onEdit: (id: string) => void,
  onDelete: (id: string) => void
}) => {
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
          onEdit={onEdit}
          onDelete={onDelete}
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

// Main component with TanStack Query
const AccountMediaTypes = () => {
  // State
  const [open, setOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [editMediaTypeId, setEditMediaTypeId] = useState<string | null>(null);
  const [selectedMediaTypeId, setSelectedMediaTypeId] = useState<string | null>(null);

  const { data: userProfile, isLoading: isUserLoading, error: userError } = useUserProfile();

  // REDUX: Get user role (replace with TanStack Query user profile)
  // const userRole = useSelector((state: RootState) => state.user.currentUser.role);
  const userRole = userProfile?.role;
  
  // TanStack Query Client
  const queryClient = useQueryClient();

  // Fetch media types with usage counts
  const { 
    data: mediaTypes = [], 
    isLoading, 
    error, 
    refetch 
  } = useMediaTypesWithUsageCounts(userProfile);
  
  // Use the query for a specific media type usage (when needed)
  const { 
    data: usageData, 
    refetch: refetchUsage 
  } = useCheckMediaTypeUsage(selectedMediaTypeId || '');
  
  // Mutation hooks
  const { mutateAsync: deleteMediaTypeMutation } = useDeleteMediaType();
  const { mutateAsync: archiveMediaTypeMutation } = useArchiveMediaType();
  
  // Handlers
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
    
    // Prefetch the usage count
    if (mediaTypeId) {
      refetchUsage();
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedMediaTypeId) return;
    
    try {
      // Find selected media type
      const mediaType = mediaTypes.find(type => type._id === selectedMediaTypeId);
      if (!mediaType) return;
      
      // Get the usage count
      const count = usageData?.count || mediaType.usageCount || 0;
      
      if (count > 0) {
        // Archive if in use
        await archiveMediaTypeMutation(selectedMediaTypeId);
        toast.success(`Media type "${mediaType.name}" archived (${count} files using it)`);
      } else {
        // Delete if not in use
        await deleteMediaTypeMutation(selectedMediaTypeId);
        // Toast handled by the mutation hook
      }
      
      // Reset dialog state
      setConfirmDialogOpen(false);
      setSelectedMediaTypeId(null);
      
      // Refresh all media types
      refetch();
    } catch (error: any) {
      console.error('Error deleting/archiving media type:', error);
      toast.error('Operation failed: ' + (error.message || 'Unknown error'));
      setConfirmDialogOpen(false);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDialogOpen(false);
    setSelectedMediaTypeId(null);
  };

  // Unified refresh: invalidate cache and refetch
  const handleUnifiedRefresh = async () => {
    try {
      toast.info('Refreshing media types...');
      // Invalidate and refetch to ensure counts and items are up-to-date
      queryClient.invalidateQueries({ queryKey: ['mediaTypes'] });
      await refetch();
      toast.success('Media types refreshed');
    } catch (error: any) {
      console.error('Error refreshing media types:', error);
      toast.error('Failed to refresh: ' + (error.message || 'Unknown error'));
    }
  };

  // CHECK USER PROFILE LOADING AND ERROR FIRST
  if (isUserLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading user data...
        </Typography>
      </Box>
    );
  }

  if (userError || !userProfile) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <Typography variant="h5" color="error" gutterBottom>
          Error Loading User Profile
        </Typography>
        <Typography>
          {userError?.message || "Could not load user profile. Please try logging in again."}
        </Typography>
        <Button component="a" href="/" variant="contained" sx={{ mt: 2 }}>
          Go to Login
        </Button>
      </Box>
    );
  }
  
  // Handle media types loading state AFTER user profile is loaded
  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <Typography variant="h6" color="error" gutterBottom>
          Error loading media types
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {error instanceof Error ? error.message : 'An unknown error occurred'}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => refetch()}
          startIcon={<FaSync />}
        >
          Retry
        </Button>
      </Box>
    );
  }

  // Render empty state
  if (mediaTypes.length === 0) {
    return <EmptyState onRefresh={handleUnifiedRefresh} />;
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
      <Box className="account-media-types" sx={{ width: "100%", overflow: "visible" }}>
        <Header />

        {/* Media Type Uploader Dialog */}
        <MediaTypeUploader 
          open={open} 
          onClose={handleClose} 
          editMediaTypeId={editMediaTypeId} 
        />
      
        {/* Main content */}
        <ActionBar 
          mediaTypes={mediaTypes}
          userRole={userRole}
          onRefresh={handleUnifiedRefresh}
          onCreateNew={() => handleEditClick('')}
        />
        
        <MediaTypeGrid 
          mediaTypes={mediaTypes}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      </Box>

      {/* Delete/Archive Confirmation Dialog */}
      <DeleteDialog
        open={confirmDialogOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        selectedId={selectedMediaTypeId}
      />
      
      {/* <ToastContainer position="top-right" /> */}
    </motion.div>
  );
};

export default AccountMediaTypes;