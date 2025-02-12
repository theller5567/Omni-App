import { useState } from "react";
import { TextField, Button, Typography, Box, Paper, Link } from "@mui/material";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../store/store"; // Ensure this path matches your project structure
import { signUpUser, signInUser } from "../store/slices/authSlice";

const AuthPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSignUp) {
      dispatch(signUpUser({ name: formData.name, email: formData.email }));
    } else {
      dispatch(signInUser({ email: formData.email }));
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
      <Paper elevation={3} sx={{ padding: 4, width: "400px" }}>
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
          <Button variant="contained" color="primary" fullWidth type="submit" sx={{ marginTop: 2 }}>
            {isSignUp ? "Sign Up" : "Sign In"}
          </Button>
        </form>
        <Box textAlign="center" marginTop={2}>
          <Link component="button" onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </Link>
        </Box>
      </Paper>
    </Box>
  );
};

export default AuthPage;
