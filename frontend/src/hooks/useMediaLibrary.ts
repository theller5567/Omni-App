import { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  initializeMedia, 
  deleteMedia as reduxDelete, 
  addMedia as reduxAdd,
  deleteMediaThunk 
} from '../store/slices/mediaSlice';
import { RootState, AppDispatch } from '../store/store';
import { BaseMediaFile } from '../interfaces/MediaFile';

/**
 * useMediaLibrary - encapsulates media fetching, filtering, and deletion
 */
export function useMediaLibrary() {
  const dispatch = useDispatch<AppDispatch>();
  const { allMedia, status, error } = useSelector((state: RootState) => state.media);

  // Filtering state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMediaType, setSelectedMediaType] = useState<string>('All');

  // Initial fetch
  useEffect(() => {
    if (status === 'idle') {
      dispatch(initializeMedia());
    }
  }, [dispatch, status]);

  // Filtered list based on search and type
  const filteredMedia = useMemo(() => {
    return allMedia.filter(file => {
      const matchesType = selectedMediaType === 'All' || file.mediaType === selectedMediaType;
      const fileName = file.metadata?.fileName ?? '';
      const matchesSearch = fileName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [allMedia, selectedMediaType, searchQuery]);

  // Expose handlers
  const deleteMedia = async (id: string) => {
    try {
      const resultAction = await dispatch(deleteMediaThunk(id));
      if (deleteMediaThunk.fulfilled.match(resultAction)) {
        // Only update the local state if the API call was successful
        dispatch(reduxDelete(id));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting media:', error);
      return false;
    }
  };
  
  const addMedia = (file: BaseMediaFile) => dispatch(reduxAdd(file));

  return {
    status,
    error,
    allMedia,
    filteredMedia,
    searchQuery,
    setSearchQuery,
    selectedMediaType,
    setSelectedMediaType,
    deleteMedia,
    addMedia,
  };
} 