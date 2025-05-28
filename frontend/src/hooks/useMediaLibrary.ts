import { useState, useMemo } from 'react';
// import { useSelector, useDispatch } from 'react-redux'; // Removed
// import { 
//   initializeMedia, 
//   deleteMedia as reduxDelete, 
//   addMedia as reduxAdd,
//   deleteMediaThunk 
// } from '../store/slices/mediaSlice'; // Removed
// import { RootState, AppDispatch } from '../store/store'; // Removed
// import { BaseMediaFile } from '../interfaces/MediaFile'; // Replaced by TransformedMediaFile if appropriate

import { 
  useUserProfile, 
  useTransformedMedia, 
  useDeleteMedia, 
  useAddMedia,
  TransformedMediaFile // Ensure this type is what useAddMedia and useDeleteMedia expect or can work with
} from './query-hooks';
import { toast } from 'react-toastify';

/**
 * useMediaLibrary - encapsulates media fetching, filtering, and deletion using TanStack Query
 */
export function useMediaLibrary() {
  // const dispatch = useDispatch<AppDispatch>(); // Removed
  // const { allMedia, status, error } = useSelector((state: RootState) => state.media); // Replaced

  // Filtering state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMediaType, setSelectedMediaType] = useState<string>('All'); // Default to 'All'

  // --- TanStack Query Hooks ---
  const { data: userProfile } = useUserProfile();
  const {
    data: allMedia = [], // Default to empty array if undefined
    isLoading,
    isError,
    error: queryError, // Renamed to avoid conflict if we return a generic error
    refetch // To allow manual refetching if needed
  } = useTransformedMedia(userProfile, selectedMediaType); // Pass selectedMediaType

  const { mutate: deleteMediaMutation, isPending: isDeleting } = useDeleteMedia();
  const { mutate: addMediaMutation, isPending: isAdding } = useAddMedia();

  // No explicit initial fetch needed with useQuery, it fetches on mount/dependency change.
  // useEffect(() => {
  //   if (status === 'idle') {
  //     dispatch(initializeMedia());
  //   }
  // }, [dispatch, status]);

  // Filtered list based on search and type
  const filteredMedia = useMemo(() => {
    if (!allMedia) return [];
    return allMedia.filter(file => {
      // mediaType in TransformedMediaFile might be an ID, ensure comparison is correct.
      // Assuming selectedMediaType is also an ID, or 'All'.
      const matchesType = selectedMediaType === 'All' || file.mediaType === selectedMediaType;
      const fileName = file.metadata?.fileName ?? file.title ?? ''; // Include title as fallback
      const matchesSearch = fileName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [allMedia, selectedMediaType, searchQuery]);

  // Expose handlers
  const deleteMediaItem = async (id: string): Promise<boolean> => {
    return new Promise((resolve) => {
      deleteMediaMutation({ mediaId: id }, {
        onSuccess: () => {
          // toast.success('Media deleted successfully'); // Handled by useDeleteMedia hook
          resolve(true);
        },
        onError: (error: any) => {
          // toast.error(error.message || 'Error deleting media'); // Handled by useDeleteMedia hook
          console.error('Error deleting media from useMediaLibrary:', error);
          resolve(false);
        }
      });
    });
  };
  
  // The addMedia function now expects the fully formed MediaFile object 
  // (or TransformedMediaFile, depending on useAddMedia hook's expectation)
  // that has ALREADY been uploaded (e.g., by MediaUploaderComponent).
  // Its main role here is to trigger the cache update via useAddMedia mutation.
  const addMediaItem = (newlyUploadedMedia: TransformedMediaFile) => {
    addMediaMutation(newlyUploadedMedia, {
      onSuccess: () => {
        // toast.success('Media added to library cache'); // Handled by useAddMedia hook
      },
      onError: (error: any) => {
        // toast.error(error.message || 'Error adding media to cache'); // Handled by useAddMedia hook
        console.error('Error adding media from useMediaLibrary:', error);
      }
    });
  };

  return {
    // Status and error from useTransformedMedia
    isLoading,
    isError,
    error: queryError,
    refetchMedia: refetch, // Expose refetch

    allMedia: allMedia || [], // Ensure it's always an array
    filteredMedia,
    searchQuery,
    setSearchQuery,
    selectedMediaType,
    setSelectedMediaType,
    deleteMediaItem, // Renamed to avoid conflict with original deleteMedia
    addMediaItem,    // Renamed to avoid conflict
    isDeleting,      // Expose loading state for delete
    isAdding,        // Expose loading state for add (if useAddMedia provides it)
  };
} 