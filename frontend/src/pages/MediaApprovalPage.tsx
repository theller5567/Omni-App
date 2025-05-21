import React, { useState } from 'react';
import { Container, Typography, CircularProgress, Box, Alert, List, ListItem, ListItemText, Paper, Chip, Tooltip, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Stack } from '@mui/material';
import { useUserProfile, usePendingMediaReviews, useApproveMedia, useRejectMedia, useRequestRevisionMedia } from '../hooks/query-hooks';
import { BaseMediaFile as MediaFile } from '../interfaces/MediaFile'; // Corrected import alias

const MediaApprovalPage: React.FC = () => {
  const { data: userProfile, isLoading: isProfileLoading } = useUserProfile();
  // Pass userProfile to the hook; it will enable/disable based on role internally
  const { data: pendingMedia, isLoading: isMediaLoading, error: mediaError, isError: isMediaError } = usePendingMediaReviews(userProfile);

  const approveMediaMutation = useApproveMedia();
  const rejectMediaMutation = useRejectMedia();
  const requestRevisionMutation = useRequestRevisionMedia();

  // State for feedback dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentMediaId, setCurrentMediaId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [dialogAction, setDialogAction] = useState<'reject' | 'requestRevision' | null>(null);

  const isLoading = isProfileLoading || isMediaLoading || approveMediaMutation.isPending || rejectMediaMutation.isPending || requestRevisionMutation.isPending;

  const handleApprove = (mediaId: string) => {
    if (mediaId) approveMediaMutation.mutate(mediaId);
  };

  const openFeedbackDialog = (mediaId: string, action: 'reject' | 'requestRevision') => {
    setCurrentMediaId(mediaId);
    setDialogAction(action);
    setFeedback(''); // Reset feedback
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentMediaId(null);
    setDialogAction(null);
  };

  const handleSubmitFeedback = () => {
    if (currentMediaId && feedback && dialogAction) {
      if (dialogAction === 'reject') {
        rejectMediaMutation.mutate({ mediaId: currentMediaId, feedback });
      } else if (dialogAction === 'requestRevision') {
        requestRevisionMutation.mutate({ mediaId: currentMediaId, feedback });
      }
      handleCloseDialog();
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading media approvals...</Typography>
      </Box>
    );
  }

  // Check if the user is not an admin after loading profile
  if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'superAdmin')) {
    return (
      <Container sx={{ mt: 5, textAlign: 'center' }}>
        <Alert severity="error">You do not have permission to view this page.</Alert>
      </Container>
    );
  }

  if (isMediaError) {
    return (
      <Container sx={{ mt: 5 }}>
        <Alert severity="error">{mediaError?.message || 'An error occurred while fetching media for approval.'}</Alert>
      </Container>
    );
  }

  const getStatusChipColor = (status?: 'pending' | 'approved' | 'rejected' | 'needs_revision'): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'needs_revision':
        return 'info';
      // Add other cases if they can appear here, though typically only pending/needs_revision
      default:
        return 'default';
    }
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Media Awaiting Approval
      </Typography>
      {pendingMedia && pendingMedia.length > 0 ? (
        <Paper elevation={2}>
          <List>
            {pendingMedia.map((media: MediaFile) => (
              <ListItem key={media._id} divider>
                <ListItemText
                  primary={media.title || media.metadata?.fileName || 'Untitled Media'}
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="text.secondary">
                        Status: {' '}
                      </Typography>
                      <Chip
                        label={media.approvalStatus?.replace('_', ' ') || 'Unknown'}
                        color={getStatusChipColor(media.approvalStatus)}
                        size="small"
                        sx={{ textTransform: 'capitalize', mr: 1 }}
                      />
                      {media.approvalStatus === 'needs_revision' && media.approvalFeedback && (
                        <Tooltip title={`Feedback: ${media.approvalFeedback}`}>
                          <Typography component="span" variant="caption" sx={{ fontStyle: 'italic', cursor: 'pointer' }}>
                            (View Feedback)
                          </Typography>
                        </Tooltip>
                      )}
                       {/* TODO: Add uploader info if available in MediaFile and needed */}
                       {/* e.g., Uploader: {media.uploadedByUsername || media.uploadedBy} */}
                    </>
                  }
                />
                {/* TODO: Add Action Buttons (Approve, Reject, Request Revision) here */}
              </ListItem>
            ))}
          </List>
        </Paper>
      ) : (
        <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 5 }}>
          There are no media items currently awaiting approval.
        </Typography>
      )}
    </Container>
  );
};

export default MediaApprovalPage; 