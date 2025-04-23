import React from "react";
import {
  Box,
  Typography,
  LinearProgress,
  CircularProgress
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";

interface UploadStatusProps {
  isProcessing: boolean;
  uploadProgress: number;
  uploadComplete: boolean;
  uploadError: string | null;
}

const UploadStatus: React.FC<UploadStatusProps> = ({
  isProcessing,
  uploadProgress,
  uploadComplete,
  uploadError
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "400px",
        padding: "2rem",
      }}
    >
      {isProcessing && (
        <>
          <CircularProgress size={80} sx={{ mb: 4 }} />
          <Typography variant="h6" gutterBottom>
            Uploading file...
          </Typography>
          <Box sx={{ width: "100%", maxWidth: "400px", mt: 2 }}>
            <LinearProgress
              variant="determinate"
              value={uploadProgress}
              sx={{ height: 10, borderRadius: 5 }}
            />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 1, textAlign: "center" }}
            >
              {uploadProgress}% Complete
            </Typography>
          </Box>
        </>
      )}

      {uploadComplete && (
        <>
          <CheckCircleIcon
            sx={{ fontSize: 80, color: "success.main", mb: 3 }}
          />
          <Typography variant="h5" gutterBottom>
            Upload Complete!
          </Typography>
        </>
      )}

      {uploadError && (
        <>
          <ErrorIcon sx={{ fontSize: 80, color: "error.main", mb: 3 }} />
          <Typography variant="h6" color="error" gutterBottom>
            Upload Failed
          </Typography>
          <Typography color="error" sx={{ mb: 3 }}>
            {uploadError}
          </Typography>
        </>
      )}
    </Box>
  );
};

export default UploadStatus; 