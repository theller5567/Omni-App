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

  // Fetch ALL media initially. Filtering by selectedMediaType will happen client-side in filteredMediaFiles memo.
  const { 
    data: allMediaData = [], // Renamed from mediaData to allMediaData
    isLoading: isLoadingMedia, 
    isError: isMediaError,
    error: mediaError
  } = useTransformedMedia(userProfile); // Removed selectedMediaType from here
  
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
    if (process.env.NODE_ENV === 'development' && allMediaData.length > 0) {
      console.log('MediaLibraryPage - Ready (allMediaData):', {
        items: allMediaData.length,
        mediaTypes: mediaTypes.length
      });
    }
  }, [allMediaData.length, mediaTypes.length]);

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
      
      // Pass silent option to prevent the hook from showing a toast
      await deleteMediaMutation({ mediaId: id, options: { silent: true } });
      return true;
    } catch (error) {
      console.error('Error deleting media file:', error);
      // MediaLibrary will show its own toast on error, so no toast here is needed
      return false;
    }
  }, [deleteMediaMutation]);

  const handleMediaTypeChange = useCallback((type: string) => {
    setSelectedMediaType(type);
  }, []);

  // Memo for media files filtered ONLY by search query (for HeaderComponent's type buttons)
  const searchFilteredMediaFiles = useMemo(() => {
    return allMediaData
      .filter((file: QueryHooksMediaFile) => {
        const searchableText = [
          file.displayTitle, 
          file.metadata?.fileName,
          file.metadata?.description,
          file.title,
          ...(file.metadata?.tags || []) 
        ].filter(Boolean).join(' ').toLowerCase();
        return searchableText.includes(searchQuery.toLowerCase());
      })
      .map((file: QueryHooksMediaFile) => { 
        // Map to the structure expected by downstream components (e.g., BaseMediaFile)
        // This mapping should be consistent with the one in filteredMediaFiles
        const libraryEntry: BaseMediaFile & { fileSize: number; modifiedDate: string; thumbnailUrl?: string; displayTitle?: string; } = {
          _id: file._id,
          id: file.id || file._id, 
          title: String(file.displayTitle || file.title || 'Untitled'), 
          location: String(file.thumbnailUrl || file.location || ''), 
          slug: file.slug || `media-${file._id}`, 
          fileExtension: file.fileExtension,
          mediaType: file.mediaType,
          fileSize: file.fileSize, 
          modifiedDate: file.modifiedDate, 
          metadata: { 
            ...(file.metadata || {}), 
            fileName: String(file.metadata?.fileName || file.displayTitle || file.title || 'Untitled'),
          },
          thumbnailUrl: String(file.thumbnailUrl) as string | undefined,
          displayTitle: String(file.displayTitle) as string | undefined,
        };
        return libraryEntry;
      });
  }, [allMediaData, searchQuery]);

  // Filter media files based on selectedMediaType and searchQuery (for actual display)
  const filteredMediaFiles = useMemo(() => {
    return allMediaData // Start with all media data
      .filter((file: QueryHooksMediaFile) => { 
        // 1. Filter by selectedMediaType
        if (selectedMediaType !== 'All' && file.mediaType !== selectedMediaType) {
          return false;
        }

        // 2. Filter by search query
        const searchableText = [
          file.displayTitle, 
          file.metadata?.fileName,
          file.metadata?.description,
          file.title,
          ...(file.metadata?.tags || []) 
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchableText.includes(searchQuery.toLowerCase());
      })
      .map((file: QueryHooksMediaFile) => { 
        const libraryEntry: BaseMediaFile & { fileSize: number; modifiedDate: string; thumbnailUrl?: string; displayTitle?: string; } = {
          _id: file._id,
          id: file.id || file._id, 
          title: String(file.displayTitle || file.title || 'Untitled'), 
          location: String(file.thumbnailUrl || file.location || ''), 
          slug: file.slug || `media-${file._id}`, 
          fileExtension: file.fileExtension,
          mediaType: file.mediaType,
          fileSize: file.fileSize, 
          modifiedDate: file.modifiedDate, 
          metadata: { 
            ...(file.metadata || {}), 
            fileName: String(file.metadata?.fileName || file.displayTitle || file.title || 'Untitled'),
          },
          thumbnailUrl: String(file.thumbnailUrl) as string | undefined,
          displayTitle: String(file.displayTitle) as string | undefined,
        };
        return libraryEntry;
      });
  }, [allMediaData, selectedMediaType, searchQuery]);

  // Only log in development and limit frequency
  const prevFilterCountRef = useRef(0);
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && 
        Math.abs(prevFilterCountRef.current - filteredMediaFiles.length) > 10) {
      console.log('MediaLibraryPage - Filter updated (filteredMediaFiles):', {
        totalSource: allMediaData.length,
        filteredResult: filteredMediaFiles.length,
        currentSearchQuery: searchQuery,
        currentMediaTypeFilter: selectedMediaType
      });
      prevFilterCountRef.current = filteredMediaFiles.length;
    }
  }, [filteredMediaFiles.length, allMediaData.length, searchQuery, selectedMediaType]);

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
        <Button variant="contained" onClick={() => window.location.href = '/'}>
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
          dataSourceForFilters={searchFilteredMediaFiles}
          setSearchQuery={setSearchQuery}
          onAddMedia={handleOpen}
          onDeleteMedia={handleDeleteMedia}
          selectedMediaType={selectedMediaType}
          handleMediaTypeChange={handleMediaTypeChange}
        />
      </Suspense>
      
      {/* Conditionally render the MediaUploader component */}
      {isModalOpen && (
        <Suspense fallback={<LoadingFallback />}>
          <MediaUploader
            open={isModalOpen}
            onClose={handleClose}
            onUploadComplete={handleUploadComplete}
            // initialSelectedMediaType can be passed if needed, e.g., from selectedMediaType state
          />
        </Suspense>
      )}
    </div>
  );
};

export default MediaContainer;