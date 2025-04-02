import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, List, ListItem, ListItemText } from '@mui/material';
import './accountMediaTypes.scss';
import { motion } from 'framer-motion';
import { ToastContainer } from 'react-toastify';
import MediaTypeUploader from '../components/MediaTypeUploader';
import axios from 'axios';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { setMediaTypes } from '../store/slices/mediaTypeSlice';

interface Field {
  name: string;
  type: string;
  options?: string[];
  required: boolean;
}

const AccountMediaTypes: React.FC = () => {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const mediaTypes = useSelector((state: RootState) => state.mediaTypes.mediaTypes);

  useEffect(() => {
    const fetchMediaTypes = async () => {
      if (mediaTypes.length === 0) {
        const response = await axios.get<any[]>('/media-types');
        dispatch(setMediaTypes(response.data));
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
      <Box className="account-media-types" sx={{ width: '100%', overflow: 'hidden' }}>
        <Typography variant="h2" align="left" sx={{ paddingBottom: '2rem' }}>Account Media Types</Typography>
        <Button variant="contained" color="primary" onClick={() => setOpen(true)}>
          Create New Media Type
        </Button>
        
        <MediaTypeUploader open={open} onClose={() => setOpen(false)} />

        <Typography variant="h4" align="left" sx={{ paddingTop: '2rem' }}>Existing Media Types</Typography>
        <List>
          {mediaTypes.map((mediaType, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={mediaType.name}
                secondary={`Fields: ${mediaType.fields.map((field: Field) => `${field.name}: (${field.type})`).join(', ')}`}
              />
            </ListItem>
          ))}
        </List>
      </Box>
      <ToastContainer />
    </motion.div>
  );
};

export default AccountMediaTypes;