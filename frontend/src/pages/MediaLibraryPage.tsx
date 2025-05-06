import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store/store';
import { addMedia } from '../store/slices/mediaSlice';
import { CircularProgress, Box, Typography } from '@mui/material';
import '../components/MediaLibrary/MediaContainer.scss';
import { toast } from 'react-toastify';
// Import React Query hooks
import { useMedia, useMediaTypes, useDeleteMedia } from '../hooks/query-hooks';
import { useQueryClient } from '@tanstack/react-query';

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
  const dispatch = useDispatch<AppDispatch>();
  const queryClient = useQueryClient();
  
  // Add refs to track upload completion
  const processingUploadRef = useRef(false);
  const uploadCallTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use React Query hooks
  const { 
    data: mediaData = [], 
    isLoading: isLoadingMedia, 
    isError: isMediaError,
    error: mediaError
  } = useMedia();
  
  const { 
    data: mediaTypes = [], 
    isLoading: isLoadingMediaTypes
  } = useMediaTypes();

  const { mutateAsync: deleteMediaMutation } = useDeleteMedia();

  // Add effect to handle refresh after upload - with debounce
  useEffect(() => {
    return () => {
      // Clear any pending timeouts on unmount
      if (uploadCallTimeoutRef.current) {
        clearTimeout(uploadCallTimeoutRef.current);
      }
    };
  }, []);

  // Track meaningful state changes - logging only in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && mediaData.length > 0) {
      console.log('MediaLibraryPage - Ready:', {
        items: mediaData.length,
        mediaTypes: mediaTypes.length
      });
    }
  }, [mediaData.length, mediaTypes.length]);

  const handleOpen = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
    // No need to force a refresh when modal closes
  }, []);

  const handleUploadComplete = useCallback((newFile: any | null) => {
    if (newFile && !processingUploadRef.current) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Upload complete, new file added to state');
      }
      
      // Set processing flag to prevent multiple refreshes
      processingUploadRef.current = true;
      
      // Add the new file to Redux store for now (this will be migrated to React Query in a future refactoring)
      dispatch(addMedia(newFile));
      
      // Update the React Query cache with the new item
      queryClient.setQueryData<any[]>(['media'], (oldData) => {
        if (!oldData) return [newFile];
        return [...oldData, newFile];
      });
      
      // Automatically reset the processing flag after a timeout
      setTimeout(() => {
        processingUploadRef.current = false;
      }, 1000);
    }
    // Do not automatically close the modal - let the user choose when to close it
  }, [dispatch, queryClient]);

  const handleDeleteMedia = useCallback(async (id: string): Promise<boolean> => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Deleting media with ID:', id);
      }
      
      // Use React Query mutation
      await deleteMediaMutation(id);
      return true;
    } catch (error) {
      console.error('Error deleting media file:', error);
      toast.error('Failed to delete media');
      return false;
    }
  }, [deleteMediaMutation]);

  const handleMediaTypeChange = useCallback((type: string) => {
    setSelectedMediaType(type);
  }, []);

  // Filter media files based on search query
  const filteredMediaFiles = useMemo(() => {
    return mediaData
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
        modifiedDate: file.modifiedDate || new Date().toISOString(), // Add missing modifiedDate field
        location: file.location || '', // Ensure location has a default value
        slug: file.slug || `media-${file._id || Date.now()}`, // Ensure slug has a default value
        metadata: {
          ...(file.metadata || {}),
          fileName: file.metadata?.fileName || file.title || 'Untitled',
          tags: file.metadata?.tags || []
        }
      }));
  }, [mediaData, searchQuery]);

  // Only log in development and limit frequency
  const prevFilterCountRef = useRef(0);
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && 
        Math.abs(prevFilterCountRef.current - filteredMediaFiles.length) > 10) {
      console.log('MediaLibraryPage - Filter updated:', {
        total: mediaData.length,
        filtered: filteredMediaFiles.length
      });
      prevFilterCountRef.current = filteredMediaFiles.length;
    }
  }, [filteredMediaFiles.length, mediaData.length]);

  // Show loading state if either media or media types are loading
  if (isLoadingMedia || isLoadingMediaTypes) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Show error state if there's an error loading media
  if (isMediaError) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography color="error">Error loading media: {mediaError instanceof Error ? mediaError.message : 'Unknown error'}</Typography>
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