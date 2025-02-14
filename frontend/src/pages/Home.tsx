import { useEffect } from "react";
import { toast, ToastContainer } from "react-toastify"; // Import Toastify for success message
import "react-toastify/dist/ReactToastify.css"; // Import the CSS for Toast notifications
import { Box, Paper, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom"; // Import useNavigate

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailVerified = params.get("emailVerified");

    if (emailVerified) {
      // Show success message
      

      // Navigate to home page after showing the success message
      // This should only happen when `emailVerified=true` is present in the URL
      navigate("/home");
      toast.success("Your email has been successfully verified!");
    }
  }, [navigate]); // Ensure this runs only after the component mounts

  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
      <Paper elevation={3} sx={{ padding: 4, width: "400px" }}>
        <Typography variant="h5" align="center" gutterBottom>
          Welcome to the Home Page!
        </Typography>
      </Paper>

      {/* Toast Notifications */}
      <ToastContainer />
    </Box>
  );
};

export default HomePage;