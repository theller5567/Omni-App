import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Button,
  Tooltip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Container
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Send as ResendIcon,
  Delete as DeleteIcon,
  DeleteForever as DeleteForeverIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../config/config';
import { formatDistance } from 'date-fns';
import './invitationList.scss'; // Import the new SCSS file

interface Invitation {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expiresAt: string;
  createdAt: string;
  invitedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface InvitationListProps {
  refreshTrigger?: number;
  onRefresh?: () => void;
}

const InvitationList: React.FC<InvitationListProps> = ({ refreshTrigger, onRefresh }) => {
  // State
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, _setPage] = useState<number>(0);
  const [rowsPerPage, _setRowsPerPage] = useState<number>(10);
  const [invitationToCancel, setInvitationToCancel] = useState<Invitation | null>(null);
  const [invitationToResend, setInvitationToResend] = useState<Invitation | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [invitationToDeletePermanently, setInvitationToDeletePermanently] = useState<Invitation | null>(null);
  const [deletePermanentlyDialogOpen, setDeletePermanentlyDialogOpen] = useState<boolean>(false);
  
  // Load invitations
  const fetchInvitations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get token
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('You must be logged in to view invitations');
        setLoading(false);
        return;
      }
      
      // Fetch invitations
      const response = await axios.get<Invitation[]>(`${API_BASE_URL}/api/invitations`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setInvitations(response.data);
      
    } catch (err: any) {
      console.error('Error fetching invitations:', err);
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('An error occurred while fetching invitations');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Load on mount and when refreshTrigger changes
  useEffect(() => {
    fetchInvitations();
  }, [refreshTrigger]);
  
  // Cancel invitation
  const handleCancelInvitation = async () => {
    if (!invitationToCancel) return;
    
    try {
      setActionLoading(`cancel-${invitationToCancel._id}`);
      
      // Get token
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('You must be logged in to cancel invitations');
        setActionLoading(null);
        return;
      }
      
      // Cancel invitation
      await axios.delete(`${API_BASE_URL}/api/invitations/${invitationToCancel._id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update local state
      setInvitations(prev => 
        prev.map(inv => 
          inv._id === invitationToCancel._id 
            ? { ...inv, status: 'cancelled' } 
            : inv
        )
      );
      
      setActionSuccess(`Invitation to ${invitationToCancel.email} has been cancelled`);
      setInvitationToCancel(null);
      
    } catch (err: any) {
      console.error('Error cancelling invitation:', err);
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('An error occurred while cancelling the invitation');
      }
    } finally {
      setActionLoading(null);
    }
  };
  
  // Resend invitation
  const handleResendInvitation = async () => {
    if (!invitationToResend) return;
    
    try {
      setActionLoading(`resend-${invitationToResend._id}`);
      
      // Get token
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('You must be logged in to resend invitations');
        setActionLoading(null);
        return;
      }
      
      // Resend invitation
      await axios.post(`${API_BASE_URL}/api/invitations/${invitationToResend._id}/resend`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update local state to refresh expiration date
      fetchInvitations();
      
      setActionSuccess(`Invitation has been resent to ${invitationToResend.email}`);
      setInvitationToResend(null);
      
    } catch (err: any) {
      console.error('Error resending invitation:', err);
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('An error occurred while resending the invitation');
      }
    } finally {
      setActionLoading(null);
    }
  };
  
  // --- New: Delete Permanently ---
  const handleDeletePermanentlyClicked = (invitation: Invitation) => {
    setInvitationToDeletePermanently(invitation);
    setDeletePermanentlyDialogOpen(true);
  };

  const handleDeletePermanentlySubmit = async () => {
    if (!invitationToDeletePermanently) return;

    try {
      setActionLoading(`delete-perm-${invitationToDeletePermanently._id}`);
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('You must be logged in to delete invitations');
        setActionLoading(null);
        return;
      }

      await axios.delete(`${API_BASE_URL}/api/invitations/${invitationToDeletePermanently._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setInvitations(prev => prev.filter(inv => inv._id !== invitationToDeletePermanently._id));
      setActionSuccess(`Invitation to ${invitationToDeletePermanently.email} has been permanently deleted.`);
      setInvitationToDeletePermanently(null);
      setDeletePermanentlyDialogOpen(false);

    } catch (err: any) {
      console.error('Error permanently deleting invitation:', err);
      setError(err.response?.data?.message || 'An error occurred while permanently deleting the invitation.');
    } finally {
      setActionLoading(null);
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    fetchInvitations();
    if (onRefresh) onRefresh();
  };
  
  
  // Render status chip
  const renderStatusChip = (status: string) => {
    let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';
    
    switch (status) {
      case 'pending':
        color = 'info';
        break;
      case 'accepted':
        color = 'success';
        break;
      case 'expired':
        color = 'warning';
        break;
      case 'cancelled':
        color = 'error';
        break;
    }
    
    return (
      <Chip 
        label={status} 
        color={color} 
        size="small"
        sx={{ textTransform: 'capitalize' }}
      />
    );
  };
  
  // Check if invitation is expired
  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    // For expiration dates, show relative time
    try {
      return formatDistance(date, new Date(), { addSuffix: true });
    } catch (error) {
      return dateString;
    }
  };
  
  return (
    <Container className="invitation-list-container">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">
          Invitations
        </Typography>
        
        <Button 
          startIcon={<RefreshIcon />} 
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {actionSuccess && (
        <Alert 
          severity="success" 
          sx={{ mb: 2 }}
          onClose={() => setActionSuccess(null)}
        >
          {actionSuccess}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : invitations.length === 0 ? (
        <Alert severity="info">
          No invitations found. Use the form above to invite new users.
        </Alert>
      ) : (
        <>
          <div className="invitation-custom-list">
            {/* Header Row */}
            <div className="invitation-list-header">
              <div className="invitation-header-cell">Name</div>
              <div className="invitation-header-cell">Email</div>
              <div className="invitation-header-cell">Role</div>
              <div className="invitation-header-cell">Status</div>
              <div className="invitation-header-cell">Expires</div>
              <div className="invitation-header-cell">Created</div>
              <div className="invitation-header-cell actions-header">Actions</div>
            </div>

            {/* Data Rows */}
            {invitations
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) // Pagination logic still applied here
              .map((invitation, index) => (
                <div 
                  className={`invitation-list-row ${index % 2 === 0 ? 'invitation-list-row--even' : 'invitation-list-row--odd'}`} 
                  key={invitation._id}
                >
                  <div className="invitation-data-cell" data-label="Name">
                    {invitation.firstName} {invitation.lastName}
                  </div>
                  <div className="invitation-data-cell" data-label="Email">{invitation.email}</div>
                  <div className="invitation-data-cell" data-label="Role" style={{ textTransform: 'capitalize' }}>
                    {invitation.role}
                  </div>
                  <div className="invitation-data-cell" data-label="Status">
                    {invitation.status === 'pending' && isExpired(invitation.expiresAt)
                      ? renderStatusChip('expired')
                      : renderStatusChip(invitation.status)}
                  </div>
                  <div className="invitation-data-cell" data-label="Expires">
                    {formatDate(invitation.expiresAt)}
                  </div>
                  <div className="invitation-data-cell" data-label="Created">
                    {formatDate(invitation.createdAt)}
                  </div>
                  <div className="invitation-data-cell invitation-actions-cell" data-label="Actions">
                    {invitation.status === 'pending' && !isExpired(invitation.expiresAt) && (
                      <>
                        <Tooltip title="Cancel Invitation">
                          <IconButton
                            size="small"
                            onClick={() => setInvitationToCancel(invitation)}
                            disabled={!!actionLoading}
                            color="warning"
                            className="action-button cancel-button"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Resend Invitation">
                          <IconButton
                            size="small"
                            onClick={() => setInvitationToResend(invitation)}
                            disabled={!!actionLoading}
                            color="primary"
                            className="action-button resend-button"
                          >
                            <ResendIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    {invitation.status === 'cancelled' && (
                      <Tooltip title="Delete Permanently">
                        <IconButton
                          size="small"
                          onClick={() => handleDeletePermanentlyClicked(invitation)}
                          disabled={!!actionLoading}
                          color="error"
                          className="action-button delete-permanently-button"
                        >
                          <DeleteForeverIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {/* Placeholder for other statuses if needed */}
                  </div>
                </div>
              ))}
          </div>
          
          {/* 
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={invitations.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          /> 
          */}
        </>
      )}
      
      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={!!invitationToCancel}
        onClose={() => setInvitationToCancel(null)}
      >
        <DialogTitle>Cancel Invitation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel the invitation sent to{' '}
            <strong>{invitationToCancel?.email}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvitationToCancel(null)}>No, Keep It</Button>
          <Button onClick={handleCancelInvitation} color="error" autoFocus>
            Yes, Cancel Invitation
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Resend Confirmation Dialog */}
      <Dialog
        open={!!invitationToResend}
        onClose={() => setInvitationToResend(null)}
      >
        <DialogTitle>Resend Invitation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Do you want to resend the invitation to{' '}
            <strong>{invitationToResend?.email}</strong>?
          </DialogContentText>
          <DialogContentText sx={{ mt: 2 }}>
            This will send a new email and extend the expiration date.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvitationToResend(null)}>Cancel</Button>
          <Button onClick={handleResendInvitation} color="primary" autoFocus>
            Resend Invitation
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- New: Confirmation Dialog for Permanent Deletion --- */}
      <Dialog open={deletePermanentlyDialogOpen} onClose={() => setDeletePermanentlyDialogOpen(false)}>
        <DialogTitle>Confirm Permanent Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete the invitation for {' '}
            <strong>{invitationToDeletePermanently?.email}</strong>? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletePermanentlyDialogOpen(false)} color="inherit" disabled={!!actionLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeletePermanentlySubmit} 
            color="error" 
            variant="contained"
            disabled={!!actionLoading}
            startIcon={actionLoading === `delete-perm-${invitationToDeletePermanently?._id}` ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {actionLoading === `delete-perm-${invitationToDeletePermanently?._id}` ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default InvitationList; 