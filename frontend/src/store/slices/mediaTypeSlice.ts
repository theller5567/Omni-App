import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import env from '../../config/env';
import { RootState } from '../store';

interface Field {
  name: string;
  type: string;
  options?: string[];
  required: boolean;
}

export interface MediaType {
  _id: string;
  name: string;
  fields: Field[];
  status: 'active' | 'deprecated' | 'archived';
  usageCount: number;
  replacedBy: string | null;
  isDeleting: boolean;
  acceptedFileTypes: string[];
  createdAt?: string;
  updatedAt?: string;
  baseType?: 'BaseImage' | 'BaseVideo' | 'BaseAudio' | 'BaseDocument' | 'Media';
  includeBaseFields?: boolean;
  catColor?: string;
  defaultTags?: string[];
}

interface MediaTypeState {
  mediaTypes: MediaType[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  currentOperation: 'none' | 'deprecating' | 'archiving' | 'migrating';
  deletionTarget: string | null;
  migrationSource: string | null;
  migrationTarget: string | null;
  affectedMediaCount: number;
}

const initialState: MediaTypeState = {
  mediaTypes: [],
  status: 'idle',
  error: null,
  currentOperation: 'none',
  deletionTarget: null,
  migrationSource: null,
  migrationTarget: null,
  affectedMediaCount: 0
};

// Add a type interface for response data
interface CountResponse {
  count: number;
}

interface MigrationResult {
  source: MediaType;
  target: MediaType;
}

export const initializeMediaTypes = createAsyncThunk(
  'mediaTypes/initialize',
  async (_, { getState }) => {
    const state = getState() as RootState;
    
    console.log('initializeMediaTypes - Starting with state:', {
      status: state.mediaTypes.status,
      count: state.mediaTypes.mediaTypes.length
    });
    
    // Only skip if we have successfully loaded data AND we have actual media type items
    if (state.mediaTypes.status === 'succeeded' && state.mediaTypes.mediaTypes.length > 0) {
      console.log('Skipping media types fetch - already loaded successfully with', state.mediaTypes.mediaTypes.length, 'items');
      return state.mediaTypes.mediaTypes;
    }
    
    // REMOVE OR MODIFY THIS CONDITION to allow empty data to be fetched
    // even if another request is in progress
    /*
    if (state.mediaTypes.status === 'loading') {
      console.log('Skipping media types fetch - request already in progress');
      return state.mediaTypes.mediaTypes;
    }
    */
    
    // Instead, allow fetch if we don't have data yet
    if (state.mediaTypes.status === 'loading' && state.mediaTypes.mediaTypes.length > 0) {
      console.log('Skipping media types fetch - request already in progress with existing data');
      return state.mediaTypes.mediaTypes;
    }
    
    try {
      console.log('Fetching media types from backend');
      const response = await axios.get<MediaType[]>(`${env.BASE_URL}/api/media-types`);
      
      // Log the response for debugging
      console.log(`Media types API returned ${response.data.length} items:`, 
        response.data.map(type => ({ id: type._id, name: type.name }))
      );
      
      // Return the mapped data
      const processedData = response.data.map(mediaType => ({
        ...mediaType,
        usageCount: mediaType.usageCount || 0
      }));
      
      console.log('Processed media types data:', processedData.length, 'items');
      return processedData;
    } catch (error: any) {
      console.error('Error fetching media types:', error);
      throw error;
    }
  }
);

export const deprecateMediaType = createAsyncThunk(
  'mediaTypes/deprecate',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.put<MediaType>(`${env.BASE_URL}/api/media-types/${id}/deprecate`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to deprecate media type');
    }
  }
);

export const archiveMediaType = createAsyncThunk(
  'mediaTypes/archive',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.put<MediaType>(`${env.BASE_URL}/api/media-types/${id}/archive`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to archive media type');
    }
  }
);

export const checkMediaTypeUsage = createAsyncThunk(
  'mediaTypes/checkUsage',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get<CountResponse>(`${env.BASE_URL}/api/media-types/${id}/usage`);
      return { id, count: response.data.count };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to check media type usage');
    }
  }
);

export const migrateMediaFiles = createAsyncThunk(
  'mediaTypes/migrate',
  async ({ sourceId, targetId }: { sourceId: string, targetId: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post<MigrationResult>(`${env.BASE_URL}/api/media-types/migrate`, {
        sourceId,
        targetId
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to migrate media files');
    }
  }
);

export const deleteMediaType = createAsyncThunk<string, string>(
  'mediaTypes/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      console.log('Deleting media type with ID:', id);
      const response = await axios.delete(`${env.BASE_URL}/api/media-types/${id}`);
      console.log('Delete response:', response.data);
      return id; // Return ID for successful deletion
    } catch (error: any) {
      console.error('Error in deleteMediaType thunk:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to delete media type');
    }
  }
);

export const updateMediaType = createAsyncThunk<MediaType, {id: string, updates: Partial<MediaType>}>(
  'mediaTypes/update',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      console.log('Updating media type with ID:', id, 'Updates:', updates);
      const response = await axios.put<MediaType>(`${env.BASE_URL}/api/media-types/${id}`, updates);
      console.log('Update response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error in updateMediaType thunk:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to update media type');
    }
  }
);

const mediaTypeSlice = createSlice({
  name: 'mediaTypes',
  initialState,
  reducers: {
    addMediaType: (state, action: PayloadAction<MediaType>) => {
      state.mediaTypes.push(action.payload);
    },
    setDeletionTarget: (state, action: PayloadAction<string | null>) => {
      state.deletionTarget = action.payload;
      state.currentOperation = action.payload ? 'deprecating' : 'none';
    },
    setMigrationSource: (state, action: PayloadAction<string | null>) => {
      state.migrationSource = action.payload;
    },
    setMigrationTarget: (state, action: PayloadAction<string | null>) => {
      state.migrationTarget = action.payload;
    },
    resetOperation: (state) => {
      state.currentOperation = 'none';
      state.deletionTarget = null;
      state.migrationSource = null;
      state.migrationTarget = null;
      state.affectedMediaCount = 0;
    },
    setMediaTypes: (state, action: PayloadAction<MediaType[]>) => {
      state.mediaTypes = action.payload;
      state.status = 'succeeded';
    },
    forceRefresh: (state) => {
      state.status = 'idle';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeMediaTypes.pending, (state) => {
        console.log('Media types fetch - PENDING');
        state.status = 'loading';
        state.error = null;
      })
      .addCase(initializeMediaTypes.fulfilled, (state, action) => {
        console.log('Media types fetch - FULFILLED with', action.payload.length, 'items');
        state.status = 'succeeded';
        state.mediaTypes = action.payload.map(mediaType => ({
          ...mediaType,
          status: mediaType.status || 'active',
          usageCount: mediaType.usageCount || 0,
          replacedBy: mediaType.replacedBy || null,
          isDeleting: mediaType.isDeleting || false
        }));
        state.error = null;
        console.log('Media types state updated to', state.mediaTypes.length, 'items');
      })
      .addCase(initializeMediaTypes.rejected, (state, action) => {
        console.log('Media types fetch - REJECTED', action.error);
        state.status = 'failed';
        state.error = action.error.message || 'Unknown error';
      })
      .addCase(deprecateMediaType.fulfilled, (state, action) => {
        const index = state.mediaTypes.findIndex(type => type._id === action.payload._id);
        if (index !== -1) {
          state.mediaTypes[index] = action.payload;
        }
      })
      .addCase(archiveMediaType.fulfilled, (state, action) => {
        const index = state.mediaTypes.findIndex(type => type._id === action.payload._id);
        if (index !== -1) {
          state.mediaTypes[index] = action.payload;
        }
      })
      .addCase(deleteMediaType.fulfilled, (state, action: PayloadAction<string>) => {
        state.mediaTypes = state.mediaTypes.filter(type => type._id !== action.payload);
      })
      .addCase(checkMediaTypeUsage.fulfilled, (state, action) => {
        const { id, count } = action.payload;
        state.affectedMediaCount = count;
        
        const index = state.mediaTypes.findIndex(type => type._id === id);
        if (index !== -1) {
          state.mediaTypes[index].usageCount = count;
        }
      })
      .addCase(migrateMediaFiles.fulfilled, (state, action) => {
        // Reset state after successful migration
        state.currentOperation = 'none';
        state.migrationSource = null;
        state.migrationTarget = null;
        
        // Update media types with new counts
        if (action.payload.source && action.payload.target) {
          const sourceIndex = state.mediaTypes.findIndex(type => type._id === action.payload.source._id);
          const targetIndex = state.mediaTypes.findIndex(type => type._id === action.payload.target._id);
          
          if (sourceIndex !== -1) {
            state.mediaTypes[sourceIndex] = action.payload.source;
          }
          
          if (targetIndex !== -1) {
            state.mediaTypes[targetIndex] = action.payload.target;
          }
        }
      })
      .addCase(updateMediaType.fulfilled, (state, action: PayloadAction<MediaType>) => {
        const index = state.mediaTypes.findIndex(type => type._id === action.payload._id);
        if (index !== -1) {
          state.mediaTypes[index] = action.payload;
        }
      });
  },
});

export const { 
  addMediaType, 
  setDeletionTarget, 
  setMigrationSource, 
  setMigrationTarget,
  resetOperation,
  setMediaTypes,
  forceRefresh 
} = mediaTypeSlice.actions;

export default mediaTypeSlice.reducer;
