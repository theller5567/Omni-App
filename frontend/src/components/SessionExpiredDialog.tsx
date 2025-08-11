import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

type Props = {
  open: boolean;
  onContinue: () => void;
  onSignIn: () => void;
};

const SessionExpiredDialog: React.FC<Props> = ({ open, onContinue, onSignIn }) => {
  return (
    <Dialog open={open} aria-labelledby="session-expired-title">
      <DialogTitle id="session-expired-title">Session ended</DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          Your session has ended. Would you like to continue?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onSignIn}>Go to Sign In</Button>
        <Button variant="contained" onClick={onContinue} autoFocus>Continue</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SessionExpiredDialog;


