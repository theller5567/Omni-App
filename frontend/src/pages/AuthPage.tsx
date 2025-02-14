// cSpell:ignore Toastify

import { useState } from "react";
import { TextField, Button, Typography, Box, Paper, CircularProgress } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { signUpUser } from "../store/slices/authSlice";
import { RootState } from "../store/store"; // Import the root state type
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { AppDispatch } from "../store/store"; // Import AppDispatch to get the correct type for dispatch
import { toast, ToastContainer } from 'react-toastify';  // Import react-toastify
import 'react-toastify/dist/ReactToastify.css';  // Import the CSS for Toast notifications

const AuthPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>(); // Use the correct dispatch type
  const navigate = useNavigate(); // Use the useNavigate hook
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [showForm, setShowForm] = useState(true); // State to show/hide the form

  const { loading, error } = useSelector((state: RootState) => state.auth); // Access loading and error from Redux state

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form Data:", formData); // Log form data before dispatching
    if (isSignUp) {
      console.log("Dispatching sign-up..."); // Log that the sign-up is being dispatched
      dispatch(signUpUser({ name: formData.name, email: formData.email }))
        .unwrap()
        .then((response) => {
          console.log("Sign-up successful:", response); // Log the successful sign-up response
          // After sign-up, hide the form and show the message
          setShowForm(false);
          toast.success("Check your email for the verification link!");
        })
        .catch((err) => {
          console.error("Sign up failed:", err); // Log if sign-up fails
        });
    } else {
      console.log("Dispatching sign-in..."); // Log that the sign-in is being dispatched
      // You can add your sign-in logic here if necessary
    }
  };

  // If the email is verified, show a success message
  const params = new URLSearchParams(window.location.search);
  const emailVerified = params.get("emailVerified");

  if (emailVerified) {
    toast.success("Your email has been successfully verified!");
    navigate("/home"); // Redirect to home page after email verification
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
      <Paper elevation={3} sx={{ padding: 4, width: "400px" }}>
        {showForm ? (
          <>
            <Typography variant="h5" align="center" gutterBottom>
              {isSignUp ? "Create an Account" : "Sign In"}
            </Typography>
            <form onSubmit={handleSubmit}>
              {isSignUp && (
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  margin="normal"
                  required
                />
              )}
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                margin="normal"
                required
              />
              <Button
                variant="contained"
                color="primary"
                fullWidth
                type="submit"
                sx={{ marginTop: 2 }}
                disabled={loading} // Disable button when loading
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : isSignUp ? "Sign Up" : "Sign In"}
              </Button>
            </form>
          </>
        ) : (
          // This part will be hidden after sign-up, user will see success message instead
          <Box>
            <Typography variant="h6" align="center" gutterBottom>
              Check your email for the verification link!
            </Typography>
          </Box>
        )}

        {/* Display error if exists */}
        {error && (
          <Typography variant="body2" color="error" align="center" sx={{ marginTop: 2 }}>
            {typeof error === "string" ? error : (error as { message?: string }).message || "An unexpected error occurred"}
          </Typography>
        )}

        <Box textAlign="center" marginTop={2}>
          <Typography
            component="button"
            onClick={() => setIsSignUp(!isSignUp)}
            sx={{ textDecoration: "underline", cursor: "pointer" }}
          >
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </Typography>
        </Box>
      </Paper>

      {/* Toast Notifications */}
      <ToastContainer />
    </Box>
  );
};

export default AuthPage;