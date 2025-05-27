import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { CircularProgress, Box, Typography, Button } from '@mui/material';
import '../components/MediaLibrary/MediaContainer.scss';
import { toast } from 'react-toastify';
// Import React Query hooks
import { 
  useTransformedMedia, 
  useMediaTypes, 
  useDeleteMedia, 
  useAddMedia,
  useUserProfile
} from '../hooks/query-hooks';
// Import the correct BaseMediaFile interface
// We'll also use the MediaFile type from query-hooks to represent the enriched data from useTransformedMedia
import { BaseMediaFile } from '../interfaces/MediaFile'; 
import type { MediaFile as QueryHooksMediaFile } from '../hooks/query-hooks';

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
  
  // Add refs to track upload completion
  const processingUploadRef = useRef(false);
  const uploadCallTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- User Profile ---
  const { 
    data: userProfile, 
    isLoading: isLoadingUserProfile, 
    isError: isUserProfileError 
  } = useUserProfile();

  // Use enhanced React Query hooks
  const { 
    data: mediaData = [], 
    isLoading: isLoadingMedia, 
    isError: isMediaError,
    error: mediaError
  } = useTransformedMedia(userProfile, selectedMediaType);
  
  const { 
    data: mediaTypes = [], 
    isLoading: isLoadingMediaTypes
  } = useMediaTypes();

  // Use enhanced mutation hooks
  const { mutateAsync: deleteMediaMutation } = useDeleteMedia();
  const { mutateAsync: addMediaMutation } = useAddMedia();

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
      
      // Use React Query mutation instead of Redux action
      addMediaMutation(newFile).catch((error: any) => {
        console.error('Error adding media:', error);
        toast.error('Failed to add media to the library');
      });
      
      // Automatically reset the processing flag after a timeout
      setTimeout(() => {
        processingUploadRef.current = false;
      }, 1000);
    }
    // Do not automatically close the modal - let the user choose when to close it
  }, [addMediaMutation]);

  const handleDeleteMedia = useCallback(async (id: string): Promise<boolean> => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('Deleting media with ID:', id);
      }
      
      // Use React Query mutation - pass the ID directly as a string
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

  // Filter media files based on search query and ensure it conforms to BaseMediaFile
  const filteredMediaFiles = useMemo(() => {
    return mediaData // mediaData is already Array<QueryHooksMediaFile> from useTransformedMedia
      .filter((file: QueryHooksMediaFile) => { // 'file' here is an item from useTransformedMedia.formattedData
        // Filter by search query - check various fields that might contain searchable content
        const searchableText = [
          file.displayTitle, // This is from useTransformedMedia
          file.metadata?.fileName,
          file.metadata?.description,
          file.title,
          // Handle tags which might be an array of strings or objects with a 'name' property
          ...(file.metadata?.tags?.map(tag => typeof tag === 'string' ? tag : tag.name) || []) 
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchableText.includes(searchQuery.toLowerCase());
      })
      .map((file: QueryHooksMediaFile) => { // 'file' is an item from useTransformedMedia.formattedData (QueryHooksMediaFile)
        // Construct the object for the MediaLibrary component, ensuring it matches BaseMediaFile + any extras MediaLibrary needs
        // The 'file' object already has most of what we need from useTransformedMedia.
        // We just need to ensure the final structure aligns with what MediaLibrary expects (BaseMediaFile)
        // and that critical fields like fileSize and modifiedDate are correctly passed.
        const libraryEntry: BaseMediaFile & { fileSize: number; modifiedDate: string; thumbnailUrl?: string; displayTitle?: string; } = {
          _id: file._id,
          id: file.id || file._id, // VirtualizedDataTable uses 'id' for getRowId
          title: file.displayTitle || file.title || 'Untitled', // Prefer displayTitle
          location: file.thumbnailUrl || file.location || '', 
          slug: file.slug || `media-${file._id}`, 
          fileExtension: file.fileExtension,
          mediaType: file.mediaType,
          
          // --- CORRECTED FIELDS ---
          fileSize: file.fileSize, // Directly use the fileSize from 'file' (output of useTransformedMedia)
          modifiedDate: file.modifiedDate, // Directly use the original modifiedDate (ISO string) from 'file'
          // --- END CORRECTIONS ---
          
          metadata: { // Pass through metadata, ensuring fileName is present
            ...(file.metadata || {}), // Spread existing metadata first
            fileName: file.metadata?.fileName || file.displayTitle || file.title || 'Untitled',
          },
          // Pass through any other fields from useTransformedMedia that MediaLibrary might use
          thumbnailUrl: file.thumbnailUrl,
          displayTitle: file.displayTitle,
        };
        return libraryEntry;
      });
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

  // --- Updated Loading and Auth Checks ---
  if (isLoadingUserProfile) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading user information...</Typography>
      </Box>
    );
  }

  if (isUserProfileError || !userProfile) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100vh">
        <Typography variant="h5" color="textSecondary" gutterBottom>
          {isUserProfileError ? 'Error Loading Profile' : 'Access Denied'}
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
          {isUserProfileError ? 'Could not load your profile. Please try again later.' : 'Please log in to view the media library.'}
        </Typography>
        <Button variant="contained" onClick={() => window.location.href = '/login'}>
          Go to Login
        </Button>
      </Box>
    );
  }
  // --- End Updated Loading and Auth Checks ---

  // Show loading state if either media or media types are loading (after user profile is confirmed)
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
      
      {/* Always render the MediaUploader component but control visibility with open prop */}
      <Suspense fallback={<LoadingFallback />}>
        <MediaUploader
          open={isModalOpen}
          onClose={handleClose}
          onUploadComplete={handleUploadComplete}
        />
      </Suspense>
    </div>
  );
};

export default MediaContainer;