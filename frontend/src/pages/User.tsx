import React, { useState, useMemo } from 'react';
import { Container, Typography, CircularProgress, Box, Alert, Avatar, Tooltip, Chip, Button as MuiButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, ToggleButtonGroup, ToggleButton, Paper } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import MediaCard from '../components/MediaLibrary/components/MediaCard';
import VirtualizedDataTable from '../components/MediaLibrary/components/VirtualizedDataTable';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { 
    useUserById,
    useMediaByUserId,
    useUserProfile,
    useDeleteMedia
  } from '../hooks/query-hooks';
import { BaseMediaFile as MediaFile } from '../interfaces/MediaFile'; // Assuming MediaFile interface is used by useMediaByUserId

const UserPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: user, isLoading: isUserLoading, error: userError, isError: isUserError } = useUserById(id);
  const { data: loggedInUserProfile } = useUserProfile();
  const { data: userMedia, isLoading: isMediaLoading, error: mediaError, isError: isMediaError } = useMediaByUserId(user?._id);
  const deleteMediaMutation = useDeleteMedia();

  // State for view mode
  const [viewMode, setViewMode] = useState<'list' | 'card'>(() => {
    return (localStorage.getItem('userPageViewMode') as 'list' | 'card') || 'card';
  });

  // State for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMediaIdForDelete, setSelectedMediaIdForDelete] = useState<string | null>(null);

  // Handler for clicking on a media file
  const handleFileClick = (file: MediaFile) => {
    if (file.slug) {
      navigate(`/media/slug/${file.slug}`);
    }
  };

  // Handler for opening the delete confirmation dialog
  const handleDeleteClick = (mediaId: string) => {
    setSelectedMediaIdForDelete(mediaId);
    setIsDeleteDialogOpen(true);
  };

  // Handler for confirming media deletion
  const handleConfirmDelete = () => {
    if (selectedMediaIdForDelete) {
      deleteMediaMutation.mutate({ mediaId: selectedMediaIdForDelete }, {
        onSuccess: () => {
          // Optionally, refetch media or optimistically update UI
          setIsDeleteDialogOpen(false);
          setSelectedMediaIdForDelete(null);
        },
        onError: (error) => {
          // Handle error, e.g., show a toast notification
          console.error("Error deleting media:", error);
          setIsDeleteDialogOpen(false);
        }
      });
    }
  };

  // Handler for closing the delete dialog
  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setSelectedMediaIdForDelete(null);
  };

  // Toggle view mode
  const toggleView = (_event: React.MouseEvent<HTMLElement>, newViewMode: 'list' | 'card' | null) => {
    if (newViewMode !== null) {
      setViewMode(newViewMode);
      localStorage.setItem('userPageViewMode', newViewMode);
    }
  };
  
  // Prepare rows for VirtualizedDataTable
  const tableRows = useMemo(() => {
    if (!userMedia) return [];
    return userMedia.map(media => ({
      ...media,
      id: media._id || media.id || '', // Ensure id is present
      // Add any other transformations needed for DataTable columns
      // For example, if DataTable expects a specific date format or nested data flattened
      fileName: media.metadata?.fileName || media.title || 'Untitled',
      // Ensure metadata exists for tags access, provide empty array as fallback
      tags: media.metadata?.tags || [],
    }));
  }, [userMedia]);

  if (isUserLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading user profile...</Typography>
      </Box>
    );
  }

  if (isUserError || !user) {
    const errorMessage = userError?.message || 'User not found or an error occurred.';
    return (
      <Container sx={{ textAlign: 'center', mt: 5 }}>
        <Alert severity="error">{errorMessage}</Alert>
      </Container>
    );
  }

  const getStatusChipColor = (status?: 'pending' | 'approved' | 'rejected' | 'needs_revision'): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'needs_revision':
        return 'info';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ padding: '2rem' }}>
      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'left' }}>
      <Avatar 
        src={user.avatar || undefined} 
        sx={{ width: 120, height: 120, margin: '0 0 2rem 0', fontSize: '3rem' }}
      >
        {(!user.avatar && user.firstName && user.lastName) ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : user.username?.charAt(0).toUpperCase()}
      </Avatar>
      <Box sx={{ paddingLeft: '2rem', textAlign: 'left' }}>
      <Typography variant="h2" gutterBottom>{user.username}</Typography>
      {user.firstName && user.lastName && (
        <Typography variant="h4" color="textSecondary" gutterBottom>
          {`${user.firstName} ${user.lastName}`}
        </Typography>
      )}
      <Typography variant="body1" color="textSecondary">
        Joined: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
      </Typography>
      </Box>
      </Box>

      <Paper sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, padding: '0.5rem' }}>
        <Typography variant="h5" gutterBottom component="div" sx={{ mb: 0 }}>
          Media Uploaded by {user.username}
        </Typography>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={toggleView}
          aria-label="view mode"
        >
          <ToggleButton value="list" aria-label="list view">
            <ViewListIcon />
          </ToggleButton>
          <ToggleButton value="card" aria-label="card view">
            <ViewModuleIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </Paper>

      {isMediaLoading && (
        <Box display="flex" justifyContent="center" alignItems="center" height="20vh">
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading media...</Typography>
        </Box>
      )}
      {isMediaError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {mediaError?.message || 'An error occurred while fetching media.'}
        </Alert>
      )}
      {!isMediaLoading && !isMediaError && userMedia && userMedia.length === 0 && (
        <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 3 }}>
          This user has not uploaded any media yet.
        </Typography>
      )}
      {!isMediaLoading && !isMediaError && userMedia && userMedia.length > 0 && (
        viewMode === 'card' ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(3, 1fr)',
                md: 'repeat(6, 1fr)',
              },
              gap: 3,
            }}
          >
            {userMedia.map((media: MediaFile) => (
              <Box key={media._id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <MediaCard
                  file={media}
                  handleFileClick={() => handleFileClick(media)}
                  onDeleteClick={(loggedInUserProfile?.role === 'superAdmin' || loggedInUserProfile?.role === 'admin') && media._id ? () => handleDeleteClick(media._id!) : undefined}
                />
                {(media.approvalStatus !== 'approved') && (
                  <Box sx={{ p: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Tooltip title={media.approvalFeedback || media.approvalStatus?.replace('_', ' ') || 'No feedback'} placement="top">
                      <Chip
                        label={media.approvalStatus?.replace('_', ' ') || 'Status Unknown'}
                        color={getStatusChipColor(media.approvalStatus)}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Tooltip>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ height: '70vh', width: '100%', mt: 2 }}> {/* Adjust height as needed */}
            <VirtualizedDataTable
              rows={tableRows}
              // onSelectionChange={(selection) => setSelectedTableRows(selection as string[])} // Removed unused prop
              showCheckboxes={false}
              // Note: VirtualizedDataTable handles its own row click navigation
              // If you need additional actions on row click specific to UserPage,
              // you might need to modify VirtualizedDataTable or pass another callback.
            />
          </Box>
        )
      )}
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this media file? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={handleCloseDeleteDialog}>Cancel</MuiButton>
          <MuiButton 
            onClick={handleConfirmDelete} 
            color="error" 
            disabled={deleteMediaMutation.isPending}
          >
            {deleteMediaMutation.isPending ? <CircularProgress size={20} /> : 'Delete'}
          </MuiButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserPage;