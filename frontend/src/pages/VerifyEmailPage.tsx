import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";  // Use useNavigate from v6
import { Box, Typography, CircularProgress, Button } from "@mui/material";
import env from '../config/env';

const VerifyEmailPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();  // Hook to navigate to other pages

  useEffect(() => {
    // Send GET request to backend for email verification with response type `VerifyEmailResponse`
    axios
      .get(`${env.BASE_URL}/api/auth/verify-email/${token}`)
      .then((response) => {
        setLoading(false);
        setMessage((response.data as { message: string }).message); // Set success message
      })
      .catch((err) => {
        setLoading(false);
        setError(err.response?.data?.message || "Something went wrong");
      });
  }, [token]);

  const handleLoginRedirect = () => {
    // Redirect to login page after successful verification
    navigate("/login");  // Use navigate() for redirection
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
      <Box textAlign="center" sx={{ padding: 4 }}>
        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Typography variant="h6" color="error">
            {error}
          </Typography>
        ) : (
          <>
            <Typography variant="h6" color="primary">
              {message}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleLoginRedirect}
              sx={{ marginTop: 2 }}
            >
              Go to Login
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
};

export default VerifyEmailPage;