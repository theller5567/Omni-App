import React, { useState, useEffect } from 'react';
import { Container, Typography, CircularProgress, Box, Alert, Avatar, Card, CardMedia, CardContent, Tooltip, Chip, CardActions, Button as MuiButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import MediaCard from '../components/MediaLibrary/components/MediaCard';
import { 
    useUserById,
    useMediaByUserId,
    useUserProfile,
    useDeleteMedia
  } from '../hooks/query-hooks';
import { BaseMediaFile as MediaFile } from '../interfaces/MediaFile'; // Assuming MediaFile interface is used by useMediaByUserId
import DeleteIcon from '@mui/icons-material/Delete';

const UserPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: user, isLoading: isUserLoading, error: userError, isError: isUserError } = useUserById(id);
  const { data: loggedInUserProfile } = useUserProfile();
  const { data: userMedia, isLoading: isMediaLoading, error: mediaError, isError: isMediaError } = useMediaByUserId(user?._id);
  const deleteMediaMutation = useDeleteMedia();

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
      deleteMediaMutation.mutate(selectedMediaIdForDelete, {
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
    <Container sx={{ mt: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
      <Avatar 
        src={user.avatar || undefined} 
        sx={{ width: 120, height: 120, margin: '0 auto 2rem auto', fontSize: '3rem' }}
      >
        {(!user.avatar && user.firstName && user.lastName) ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : user.username?.charAt(0).toUpperCase()}
      </Avatar>
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

      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2, textAlign: 'center' }}>
        Media Uploaded by {user.username}
      </Typography>
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
        <Typography sx={{ textAlign: 'center', color: 'text.secondary' }}>
          This user has not uploaded any media yet.
        </Typography>
      )}
      {!isMediaLoading && !isMediaError && userMedia && userMedia.length > 0 && (
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
    </Container>
  );
};

export default UserPage;