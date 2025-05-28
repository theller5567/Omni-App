import React, { useState } from 'react';
import { Typography, CircularProgress, Box, Alert, List, ListItem, ListItemText, Paper, Chip, Tooltip, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, Stack, ListItemAvatar } from '@mui/material';
import { useUserProfile, usePendingMediaReviews, useApproveMedia, useRejectMedia, useRequestRevisionMedia, useRejectedMedia, useDeleteMedia } from '../../hooks/query-hooks';
import { BaseMediaFile as MediaFile } from '../../interfaces/MediaFile';
import UserAvatar from '../UserDisplay/UserAvatar';

const MediaApprovalSection: React.FC = () => { 
  const { data: userProfile, isLoading: isProfileLoading } = useUserProfile();
  const { data: pendingMedia, isLoading: isMediaLoading, error: mediaError, isError: isMediaError } = usePendingMediaReviews(userProfile);
  const { data: rejectedMedia, isLoading: isRejectedLoading, error: rejectedError, isError: isRejectedError } = useRejectedMedia(userProfile);

  const approveMediaMutation = useApproveMedia();
  const rejectMediaMutation = useRejectMedia();
  const requestRevisionMutation = useRequestRevisionMedia();
  const deleteMediaMutation = useDeleteMedia();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentMediaId, setCurrentMediaId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [dialogAction, setDialogAction] = useState<'reject' | 'requestRevision' | null>(null);

  const isLoading = 
    isProfileLoading || 
    isMediaLoading || 
    isRejectedLoading || 
    approveMediaMutation.isPending || 
    rejectMediaMutation.isPending || 
    requestRevisionMutation.isPending ||
    deleteMediaMutation.isPending;

  const handleApprove = (mediaId: string) => {
    if (mediaId) approveMediaMutation.mutate(mediaId);
  };

  const openFeedbackDialog = (mediaId: string, action: 'reject' | 'requestRevision') => {
    setCurrentMediaId(mediaId);
    setDialogAction(action);
    setFeedback('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentMediaId(null);
    setDialogAction(null);
  };

  const handleDeleteRejected = (mediaId: string) => {
    if (window.confirm('Are you sure you want to permanently delete this rejected media item?')) {
      deleteMediaMutation.mutate({ mediaId });
    }
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

  if (isLoading && !(approveMediaMutation.isPending || rejectMediaMutation.isPending || requestRevisionMutation.isPending || deleteMediaMutation.isPending)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh" p={3}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading media approval data...</Typography>
      </Box>
    );
  }

  if (!isProfileLoading && (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'superAdmin'))) {
    return (
      <Box p={3}>
        <Alert severity="error">You do not have permission to view this section.</Alert>
      </Box>
    );
  }
  
  const getStatusChipColor = (status?: 'pending' | 'approved' | 'rejected' | 'needs_revision'): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'needs_revision':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Paper 
        elevation={2} 
        className="dashboard-card media-types-chart" 
        style={{ gridColumn: 'span 7' }}
      >
      {/* Pending and Needs Revision Section */}
      <Typography variant="h6" gutterBottom sx={{ mb: 2, mt: 1 }}> 
        Pending Review & Revisions
      </Typography>
      {isMediaLoading && !pendingMedia && (
         <Box display="flex" justifyContent="center" alignItems="center" minHeight="20vh">
            <CircularProgress size={30}/>
            <Typography sx={{ ml: 2 }} color="text.secondary">Loading pending items...</Typography>
        </Box>
      )}
      {isMediaError && (
        <Alert severity="error" sx={{mb: 2}}>{mediaError?.message || 'An error occurred while fetching media for approval.'}</Alert>
      )}
      {!isMediaLoading && pendingMedia && pendingMedia.length > 0 ? (
        <Paper elevation={1} sx={{mb: 4}}>
          <List disablePadding>
            {pendingMedia.map((media: MediaFile) => (
              <ListItem className="media-approval-item" key={media._id} divider>
                <ListItemText
                  className="media-approval-item-text"
                  primary={media.title || media.metadata?.fileName || 'Untitled Media'}
                  secondaryTypographyProps={{ component: 'div'}} 
                  secondary={
                    <Box component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap'}}>
                      <Chip
                        label={media.approvalStatus?.replace('_', ' ') || 'Unknown'}
                        color={getStatusChipColor(media.approvalStatus)}
                        size="small"
                        sx={{ textTransform: 'capitalize', verticalAlign: 'middle' }}
                      />
                      {media.approvalStatus === 'needs_revision' && media.approvalFeedback && (
                        <Tooltip title={`Feedback: ${media.approvalFeedback}`}>
                          <Typography component="span" variant="caption" sx={{ fontStyle: 'italic', cursor: 'pointer', verticalAlign: 'middle' }}>
                            (View Feedback)
                          </Typography>
                        </Tooltip>
                      )}
                    </Box>
                  }
                />
                <Stack direction="row" spacing={1} sx={{ ml: 2, flexShrink: 0 }}>
                  <Button 
                    variant="contained" 
                    color="success" 
                    size="small"
                    onClick={() => handleApprove(media._id!)}
                    disabled={isLoading}
                  >
                    Approve
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="error" 
                    size="small"
                    onClick={() => openFeedbackDialog(media._id!, 'reject')}
                    disabled={isLoading}
                  >
                    Reject
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="info" 
                    size="small"
                    onClick={() => openFeedbackDialog(media._id!, 'requestRevision')}
                    disabled={isLoading}
                  >
                    Needs Revision
                  </Button>
                </Stack>
              </ListItem>
            ))}
          </List>
        </Paper>
      ) : (
        !isMediaLoading && !isMediaError && (
            <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 2, mb: 4 }}>
            There are no media items currently awaiting your review or needing revision.
            </Typography>
        )
      )}

      {/* Rejected Media Section */}
      {(userProfile?.role === 'superAdmin' || userProfile?.role === 'admin') && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}> 
            Rejected Media Log
          </Typography>
          {isRejectedLoading && !rejectedMedia && (
             <Box display="flex" justifyContent="center" alignItems="center" minHeight="20vh">
                <CircularProgress size={30} />
                <Typography sx={{ ml: 2 }} color="text.secondary">Loading rejected items...</Typography>
            </Box>
          )}
          {isRejectedError && (
            <Alert severity="error" sx={{mb: 2}}>{rejectedError?.message || 'An error occurred while fetching rejected media.'}</Alert>
          )}
          {!isRejectedLoading && rejectedMedia && rejectedMedia.length > 0 ? (
            <Paper elevation={1}> 
              <List disablePadding>
                {rejectedMedia.map((media: MediaFile) => (
                  <ListItem key={media._id} divider>
                    <ListItemAvatar>
                      <UserAvatar 
                        userId={typeof media.metadata?.uploadedBy === 'string' ? media.metadata.uploadedBy : undefined} 
                        fallbackName={media.title || media.metadata?.fileName}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={media.title || media.metadata?.fileName || 'Untitled Media'}
                      secondaryTypographyProps={{ component: 'div'}} 
                      secondary={
                        <Box component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap'}}>
                          <Chip
                            label={media.approvalStatus?.replace('_', ' ') || 'Unknown'}
                            color="error"
                            size="small"
                            sx={{ textTransform: 'capitalize', verticalAlign: 'middle' }}
                          />
                          {media.approvalFeedback && (
                            <Tooltip title={`Feedback: ${media.approvalFeedback}`}>
                              <Typography component="span" variant="caption" sx={{ fontStyle: 'italic', cursor: 'pointer', verticalAlign: 'middle' }}>
                                (View Feedback)
                              </Typography>
                            </Tooltip>
                          )}
                        </Box>
                      }
                    />
                    <Stack direction="row" spacing={1} sx={{ ml: 2, flexShrink: 0 }}>
                      {userProfile?.role === 'superAdmin' && (
                        <Button 
                          variant="outlined" 
                          color="error" 
                          size="small"
                          onClick={() => handleDeleteRejected(media._id!)}
                          disabled={deleteMediaMutation.isPending || isLoading} 
                        >
                          {deleteMediaMutation.isPending && deleteMediaMutation.variables?.mediaId === media._id ? (
                            <CircularProgress size={20} sx={{mr:1}} /> 
                          ) : null}
                          Delete Log Entry
                        </Button>
                      )}
                    </Stack>
                  </ListItem>
                ))}
              </List>
            </Paper>
          ) : (
            !isRejectedLoading && !isRejectedError && (
              <Typography sx={{ textAlign: 'center', color: 'text.secondary', mt: 2, mb: 2 }}>
                There are no rejected media items in the log.
              </Typography>
            )
          )}
        </Box>
      )}

      {/* Feedback Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {dialogAction === 'reject' ? 'Reject Media' : 'Request Revision'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please provide feedback for {dialogAction === 'reject' ? 'rejecting' : 'requesting revision for'} this media item:
            {currentMediaId && (pendingMedia?.find((m: MediaFile) => m._id === currentMediaId)?.title || rejectedMedia?.find((m: MediaFile) => m._id === currentMediaId)?.title) && (
              <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold', mt: 1}}>
                Item: {pendingMedia?.find((m: MediaFile) => m._id === currentMediaId)?.title || rejectedMedia?.find((m: MediaFile) => m._id === currentMediaId)?.title}
              </Typography>
            )}
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="feedback"
            label="Feedback / Reason"
            type="text"
            fullWidth
            variant="outlined"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            multiline
            rows={4}
            required
          />
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px'}}>
          <Button onClick={handleCloseDialog} color="inherit">Cancel</Button>
          <Button 
            onClick={handleSubmitFeedback} 
            disabled={!feedback.trim() || (dialogAction === 'reject' && rejectMediaMutation.isPending) || (dialogAction === 'requestRevision' && requestRevisionMutation.isPending)}
            variant="contained"
            color={dialogAction === 'reject' ? 'error' : 'info'}
          >
            {dialogAction === 'reject' ? (rejectMediaMutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'Submit Rejection') 
                                      : (requestRevisionMutation.isPending ? <CircularProgress size={24} color="inherit" /> : 'Submit for Revision')}
          </Button>
        </DialogActions>
      </Dialog>

    </Paper>
  );
};

export default MediaApprovalSection; 