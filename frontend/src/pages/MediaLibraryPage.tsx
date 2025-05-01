import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { deleteMedia, initializeMedia, addMedia, deleteMediaThunk } from '../store/slices/mediaSlice';
import { initializeMediaTypes } from '../store/slices/mediaTypeSlice';
import { CircularProgress, Box, Typography } from '@mui/material';
import '../components/MediaLibrary/MediaContainer.scss';
import { toast } from 'react-toastify';

// Lazy load components
const MediaUploader = lazy(() => import('../components/MediaUploader/MediaUploader'));
const MediaLibrary = lazy(() => import('../components/MediaLibrary/MediaLibrary'));

// Loading fallback component
const LoadingFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" height="500px">
    <CircularProgress />
  </Box>
);

const MediaContainer: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMediaType, setSelectedMediaType] = useState<string>('All');
  const mediaState = useSelector((state: RootState) => state.media);
  const mediaTypesState = useSelector((state: RootState) => state.mediaTypes);
  const dispatch = useDispatch<AppDispatch>();
  
  // Add refs to track upload completion
  const processingUploadRef = useRef(false);
  const uploadCallTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize media and media types
  useEffect(() => {
    if (mediaState.status === 'idle' && mediaState.allMedia.length === 0) {
      dispatch(initializeMedia());
    }
    
    // Also initialize media types if they haven't been loaded yet
    if (mediaTypesState.status === 'idle' && mediaTypesState.mediaTypes.length === 0) {
      dispatch(initializeMediaTypes());
    }
  }, [dispatch, mediaState.status, mediaState.allMedia.length, mediaTypesState.status, mediaTypesState.mediaTypes.length]);

  // Add effect to handle refresh after upload - with debounce
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
        if (process.env.NODE_ENV !== 'production') {
          console.log('MediaLibraryPage - Ready:', {
            status: currentState.status,
            items: currentState.count
          });
        }
      }
    }

    prevStateRef.current = currentState;
  }, [mediaState.status, mediaState.allMedia.length]);

  const handleOpen = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
    // No need to force a refresh when modal closes
  }, []);

  const handleUploadComplete = useCallback((newFile: any | null) => {
    if (newFile && !processingUploadRef.current) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Upload complete, new file:', newFile);
      }
      
      // Set processing flag to prevent multiple refreshes
      processingUploadRef.current = true;
      
      // Add the new file into Redux store so the data-table updates
      // This is sufficient to update the UI without a full refresh
      dispatch(addMedia(newFile));
      
      // Automatically reset the processing flag after a timeout
      setTimeout(() => {
        processingUploadRef.current = false;
      }, 1000);
    }
    // Do not automatically close the modal - let the user choose when to close it
  }, [dispatch]);

  const handleDeleteMedia = useCallback(async (id: string): Promise<boolean> => {
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Deleting media with ID:', id);
      }
      
      // Use the thunk action with authorization instead of direct axios call
      const resultAction = await dispatch(deleteMediaThunk(id));
      
      if (deleteMediaThunk.fulfilled.match(resultAction)) {
        // If the API call was successful, update the local state
        dispatch(deleteMedia(id));
        // Success toast is shown in MediaLibrary component
        return true;
      } else {
        // Handle rejected action
        const errorMessage = typeof resultAction.payload === 'string' 
          ? resultAction.payload 
          : 'Error deleting media';
        toast.error(errorMessage);
        return false;
      }
    } catch (error) {
      console.error('Error deleting media file:', error);
      toast.error('Failed to delete media');
      return false;
    }
  }, [dispatch]);

  const handleMediaTypeChange = useCallback((type: string) => {
    setSelectedMediaType(type);
  }, []);

  // Filter media files based on search query
  const filteredMediaFiles = useMemo(() => {
    // First log some debug information
    if (mediaState.allMedia.length > 0) {
      console.log('MediaLibraryPage - Filtering media files:', {
        total: mediaState.allMedia.length,
        searchQuery
      });
    }
    
    return mediaState.allMedia
      .filter(file => {
        // Basic field validation - ensure required fields exist
        if (!file || !file._id) {
          console.warn('MediaLibraryPage - Found media item without required fields:', file);
          return false;
        }
        
        // Filter by search query
        return file.metadata?.fileName?.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .map(file => ({
        // Ensure all required fields have default values for rendering
        ...file,
        id: file._id || file.id || `media-${Date.now()}`, // Ensure id exists
        _id: file._id || file.id || `media-${Date.now()}`, // Ensure _id exists
        mediaType: file.mediaType || 'Unknown',
        fileExtension: file.fileExtension || '',
        metadata: {
          ...(file.metadata || {}),
          fileName: file.metadata?.fileName || file.title || 'Untitled',
          tags: file.metadata?.tags || []
        }
      }));
  }, [mediaState.allMedia, searchQuery]);

  // Add debugging logs
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      // Limit logging frequency to avoid console spam
      if (Math.random() < 0.1) {
        console.log('MediaLibraryPage - MediaState:', {
          status: mediaState.status,
          totalMedia: mediaState.allMedia.length,
          filteredMedia: filteredMediaFiles.length
        });
        
        if (filteredMediaFiles.length > 0) {
          console.log('MediaLibraryPage - Sample media:', filteredMediaFiles[0]);
        }
      }
    }
  }, [mediaState.status, mediaState.allMedia.length, filteredMediaFiles.length, filteredMediaFiles]);

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
      <Suspense fallback={<LoadingFallback />}>
        <MediaLibrary
          mediaFilesData={filteredMediaFiles}
          setSearchQuery={setSearchQuery}
          onAddMedia={handleOpen}
          onDeleteMedia={handleDeleteMedia}
          selectedMediaType={selectedMediaType}
          handleMediaTypeChange={handleMediaTypeChange}
        />
      </Suspense>
      
      {isModalOpen && (
        <Suspense fallback={<LoadingFallback />}>
          <MediaUploader
            open={isModalOpen}
            onClose={handleClose}
            onUploadComplete={handleUploadComplete}
          />
        </Suspense>
      )}
    </div>
  );
};

export default MediaContainer;