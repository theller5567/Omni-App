import React, { useState } from 'react';
import { Button, Typography, Dialog, DialogContent, DialogActions } from '@mui/material';
import InvitationForm from './InvitationForm';
import InvitationList from './InvitationList';
import './AcceptInvitations.scss';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
const UserInvitation: React.FC = () => {
  // State to trigger refreshes after form submissions
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const [newUserDialog, setNewUserDialog] = useState(false);
  
  // Callback for when an invitation is sent
  const handleInvitationSent = () => {
    // Increment the refresh trigger to cause the list to refresh
    setRefreshTrigger(prev => prev + 1);
  };
  
  return (
    <div id="user-invitation">
      <div className="invitation-header">
        <Typography variant="h1" className="page-title">
          User Invitations
        </Typography>
        
        <Typography variant="body1" className="page-description">
          Invite new users to join Omni's Media Library. Invited users will receive an email with instructions to create their account.
        </Typography>
      </div>
      
      <div className="invitation-content">
        <Button 
          variant="contained" 
          color="primary" 
          size='large' 
          className="invitation-button" 
          startIcon={<AddIcon />}
          onClick={() => setNewUserDialog(true)}
          sx={{ width: 'auto' }}
        >
          Add new user
        </Button>
        {newUserDialog && (
          <Dialog open={newUserDialog} onClose={() => setNewUserDialog(false)}>
            <DialogActions>
              <Button onClick={() => setNewUserDialog(false)}><CloseIcon /></Button>
            </DialogActions>
            <DialogContent className="invitation-form-section"  >
              <InvitationForm onInvitationSent={handleInvitationSent} />
            </DialogContent>
          </Dialog>
        )}
        {/* <div className="invitation-form-section">
          <InvitationForm onInvitationSent={handleInvitationSent} />
        </div> */}
        
        <div className="invitation-list-section">
          <InvitationList refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
};

export default UserInvitation; 