import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, Grid, Card, CardContent, CardActions, Chip } from '@mui/material';
import './accountMediaTypes.scss';
import { motion } from 'framer-motion';
import { ToastContainer } from 'react-toastify';
import MediaTypeUploader from '../components/MediaTypeUploader';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { initializeMediaTypes } from '../store/slices/mediaTypeSlice';
import { FaEye, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

interface Field {
  name: string;
  type: string;
  options?: string[];
  required: boolean;
}

const AccountMediaTypes: React.FC = () => {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const mediaTypes = useSelector((state: RootState) => state.mediaTypes.mediaTypes);

  useEffect(() => {
    const fetchMediaTypes = async () => {
      if (mediaTypes.length === 0) {
        dispatch(initializeMediaTypes());
      }
    };
    fetchMediaTypes();
  }, []);

  return (
    <motion.div
      id="account-media-types"
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -100 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        className="account-media-types"
        sx={{ width: "100%", overflow: "hidden" }}
      >
        <Typography variant="h2" align="left" sx={{ paddingBottom: "2rem" }}>
          Account Media Types
        </Typography>

        <MediaTypeUploader open={open} onClose={() => setOpen(false)} />
        <Box
          className="header-component"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          padding="1rem"
          bgcolor="var(--secondary-color)"
        >
          <div className="media-types-container">
            <Typography
              variant="h5"
              align="left"
            >
              Existing Media Types
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => setOpen(true)}
            >
              <FaPlus style={{ marginRight: "0.5rem" }} /> Create New Media Type
            </Button>
          </div>
        </Box>

        <Grid container spacing={2}>
          {mediaTypes.map((mediaType, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Card className="media-type-card">
                <CardContent>
                  <Typography variant="h6" className="media-type-title">
                    {mediaType.name}
                  </Typography>

                  <Box className="field-count-chip">
                    <Chip
                      label={`${mediaType.fields.length} field${
                        mediaType.fields.length !== 1 ? "s" : ""
                      }`}
                      color="primary"
                      size="small"
                    />
                  </Box>

                  <Box className="field-type-chips" sx={{ mt: 1 }}>
                    {Array.from(
                      new Set(mediaType.fields.map((field) => field.type))
                    ).map((type, idx) => (
                      <Chip
                        key={idx}
                        label={type}
                        variant="outlined"
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>

                  <Box className="fields-preview" sx={{ mt: 2 }}>
                    {mediaType.fields
                      .slice(0, 3)
                      .map((field: Field, fieldIndex) => (
                        <Box key={fieldIndex} sx={{ mb: 1 }}>
                          <Typography
                            variant="body2"
                            component="div"
                            className="field-name"
                          >
                            {field.name}{" "}
                            {field.required && (
                              <span className="required-badge">*</span>
                            )}
                            <span className="field-type">({field.type})</span>
                          </Typography>
                          {field.options && field.options.length > 0 && (
                            <Typography
                              variant="caption"
                              className="field-options"
                            >
                              Options: {field.options.slice(0, 3).join(", ")}
                              {field.options.length > 3 && "..."}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    {mediaType.fields.length > 3 && (
                      <Typography variant="caption" color="text.secondary">
                        + {mediaType.fields.length - 3} more field
                        {mediaType.fields.length - 3 !== 1 ? "s" : ""}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
                <CardActions className="card-actions">
                  <Button size="small" startIcon={<FaEye />}>
                    View
                  </Button>
                  <Button size="small" startIcon={<FaEdit />}>
                    Edit
                  </Button>
                  <Button size="small" color="error" startIcon={<FaTrash />}>
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
      <ToastContainer />
    </motion.div>
  );
};

export default AccountMediaTypes;