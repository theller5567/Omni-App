import React, { useState, useEffect, useRef } from 'react';
import MediaUploader from '../components/MediaUploader/MediaUploader';
import MediaLibrary from '../components/MediaLibrary/MediaLibrary';
import axios from 'axios';
import '../components/MediaLibrary/MediaContainer.scss';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { deleteMedia, initializeMedia } from '../store/slices/mediaSlice';
import { CircularProgress, Box, Typography } from '@mui/material';
import env from '../config/env';

const MediaContainer: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMediaType, setSelectedMediaType] = useState<string>('All');
  const mediaState = useSelector((state: RootState) => state.media);
  const dispatch = useDispatch<AppDispatch>();
  const [needsRefresh, setNeedsRefresh] = useState(false);
  
  // Add refs to track upload completion
  const processingUploadRef = useRef(false);
  const uploadCallTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Single initialization effect
  useEffect(() => {
    if (mediaState.status === 'idle' && mediaState.allMedia.length === 0) {
      dispatch(initializeMedia());
    }
  }, [dispatch, mediaState.status, mediaState.allMedia.length]);

  // Add effect to handle refresh after upload - with debounce
  useEffect(() => {
    if (needsRefresh && !processingUploadRef.current) {
      console.log('MediaLibraryPage - Refreshing data after upload');
      
      // Set processing flag to avoid multiple calls
      processingUploadRef.current = true;
      
      // Clear any existing timeout
      if (uploadCallTimeoutRef.current) {
        clearTimeout(uploadCallTimeoutRef.current);
      }
      
      // Debounce the refresh to ensure it only happens once
      uploadCallTimeoutRef.current = setTimeout(() => {
        dispatch(initializeMedia());
        setNeedsRefresh(false);
        
        // Reset the processing flag after a delay
        setTimeout(() => {
          processingUploadRef.current = false;
        }, 500);
      }, 300);
    }
  }, [needsRefresh, dispatch]);

  // Handle component cleanup
  useEffect(() => {
    return () => {
      // Clear any pending timeouts on unmount
      if (uploadCallTimeoutRef.current) {
        clearTimeout(uploadCallTimeoutRef.current);
      }
    };
  }, []);

  // Track meaningful state changes
  const prevStateRef = React.useRef({
    status: mediaState.status,
    count: mediaState.allMedia.length
  });

  useEffect(() => {
    const prevState = prevStateRef.current;
    const currentState = {
      status: mediaState.status,
      count: mediaState.allMedia.length
    };

    // Only log meaningful transitions
    if (prevState.status !== currentState.status || prevState.count !== currentState.count) {
      if (currentState.status === 'succeeded' && currentState.count > 0) {
        console.log('MediaLibraryPage - Ready:', {
          status: currentState.status,
          items: currentState.count
        });
      }
    }

    prevStateRef.current = currentState;
  }, [mediaState.status, mediaState.allMedia.length]);

  const handleOpen = () => {
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const handleUploadComplete = (newFile: any | null) => {
    if (newFile && !processingUploadRef.current) {
      console.log('Upload complete, new file:', newFile);
      
      // Set processing flag to prevent multiple refreshes
      processingUploadRef.current = true;
      
      // Set flag to refresh data after upload
      setNeedsRefresh(true);
      
      // Automatically reset the processing flag after a timeout
      setTimeout(() => {
        processingUploadRef.current = false;
      }, 1000);
    }
    // Do not automatically close the modal - let the user choose when to close it
  };

  const handleDeleteMedia = async (id: string): Promise<boolean> => {
    try {
      console.log('Deleting media with ID:', id);
      await axios.delete(`${env.BASE_URL}/media/delete/${id}`);
      dispatch(deleteMedia(id));
      return true;
    } catch (error) {
      console.error('Error deleting media file:', error);
      return false;
    }
  };

  const handleMediaTypeChange = (type: string) => {
    setSelectedMediaType(type);
  };

  // Filter media files based on search query
  const filteredMediaFiles = mediaState.allMedia.filter(file => {
    return file.metadata && file.metadata.fileName && file.metadata.fileName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (mediaState.status === 'loading') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (mediaState.status === 'failed') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography color="error">Error loading media: {mediaState.error}</Typography>
      </Box>
    );
  }

  return (
    <div id="media-container">
        <MediaLibrary
          mediaFilesData={filteredMediaFiles}
          setSearchQuery={setSearchQuery}
          onAddMedia={handleOpen}
          onDeleteMedia={handleDeleteMedia}
          selectedMediaType={selectedMediaType}
        handleMediaTypeChange={handleMediaTypeChange}
      />
      <MediaUploader
        open={isModalOpen}
        onClose={handleClose}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
};

export default MediaContainer;