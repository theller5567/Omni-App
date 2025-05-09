import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  IconButton,
  Zoom
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../config/config';
import '../components/UserInvitation/AcceptInvitations.scss';

interface InvitationData {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  expiresAt: string;
}

const AcceptInvitation: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  // States
  const [validating, setValidating] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  
  // Steps
  const steps = ['Validate Invitation', 'Create Password', 'Account Created'];
  
  // Validate invitation token on component mount
  useEffect(() => {
    const validateToken = async () => {
      try {
        setValidating(true);
        setError(null);
        
        if (!token) {
          setError('Invalid invitation link');
          setValidating(false);
          return;
        }
        
        const response = await axios.get<{
          valid: boolean;
          invitation?: InvitationData;
          message?: string;
        }>(`${API_BASE_URL}/api/invitations/validate/${token}`);
        
        if (response.data.valid && response.data.invitation) {
          setInvitation(response.data.invitation);
          setActiveStep(1); // Move to password creation step
        } else {
          setError('This invitation is no longer valid');
        }
      } catch (err: any) {
        console.error('Error validating invitation:', err);
        
        if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError('This invitation is invalid or has expired');
        }
      } finally {
        setValidating(false);
      }
    };
    
    validateToken();
  }, [token]);
  
  // Password validation
  const validatePasswords = (): boolean => {
    // Reset error
    setPasswordError(null);
    
    // Check if passwords match
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }
    
    // Check password length
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return false;
    }
    
    return true;
  };
  
  // Handle account creation
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (!validatePasswords()) {
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Send request to accept invitation with proper response type
      const response = await axios.post<{
        token: string;
        message: string;
        user: {
          id: string;
          firstName: string;
          lastName: string;
          email: string;
          role: string;
        }
      }>(`${API_BASE_URL}/api/invitations/accept/${token}`, {
        password
      });
      
      // Handle successful response
      if (response.data.token) {
        // Store token in localStorage
        localStorage.setItem('authToken', response.data.token);
        
        // Move to final step
        setActiveStep(2);
        
        // Redirect to account page after a short delay
        setTimeout(() => {
          navigate('/account');
        }, 3000);
      }
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('An error occurred while creating your account');
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };
  
  // Handle navigating to login page
  const handleGoToLogin = () => {
    navigate('/login');
  };
  
  // Render content based on current step
  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Validating
        return (
          <div className="validation-container">
            {validating ? (
              <>
                <CircularProgress size={60} className="progress-indicator" />
                <Typography variant="h6" className="validation-text">
                  Validating your invitation...
                </Typography>
              </>
            ) : error ? (
              <>
                <Alert severity="error" className="validation-alert">
                  {error}
                </Alert>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleGoToLogin}
                  className="login-button"
                >
                  Go to Login
                </Button>
              </>
            ) : null}
          </div>
        );
        
      case 1: // Password creation
        return (
          <div className="password-form-container">
            <Typography variant="h6" className="form-title">
              Create your password
            </Typography>
            
            <Alert severity="info" className="invitation-info">
              You've been invited as a <strong>{invitation?.role}</strong>. Please create a password to complete your registration.
            </Alert>
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="password-field"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={togglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="password-field"
            />
            
            {passwordError && (
              <Alert severity="error" className="error-alert">
                {passwordError}
              </Alert>
            )}
            
            {error && (
              <Alert severity="error" className="error-alert">
                {error}
              </Alert>
            )}
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              className="submit-button"
              disabled={submitting}
              onClick={handleCreateAccount}
            >
              {submitting ? <CircularProgress size={24} /> : 'Create Account'}
            </Button>
          </div>
        );
        
      case 2: // Success
        return (
          <div className="success-container">
            <Zoom in>
              <CheckCircleIcon color="success" className="success-icon" />
            </Zoom>
            <Typography variant="h5" className="success-title">
              Account Created Successfully!
            </Typography>
            <Typography className="success-message">
              Welcome to Omni's Media Library. You're now being redirected to your account...
            </Typography>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div id="invitation-accept-page">
      <div className="invitation-container">
        <Paper elevation={3} className="invitation-paper">
          <Typography variant="h4" className="page-title">
            Welcome to Omni
          </Typography>
          
          <Stepper activeStep={activeStep} className="invitation-stepper">
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {renderStepContent()}
        </Paper>
      </div>
    </div>
  );
};

export default AcceptInvitation; 