import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import env from '../../config/env';

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

export const initializeMediaTypes = createAsyncThunk(
  'mediaTypes/initialize',
  async (_, { dispatch }) => {
    try {
      console.log('Fetching media types from backend');
      const response = await axios.get<MediaType[]>(`${env.BASE_URL}/api/media-types`);
      console.log('Media types received:', response.data);
      
      // For each media type, fetch its usage count
      const mediaTypesWithCounts = await Promise.all(
        response.data.map(async (mediaType) => {
          try {
            // Fetch the usage count for this media type
            const countResponse = await axios.get(`${env.BASE_URL}/api/media-types/${mediaType._id}/usage`);
            return {
              ...mediaType,
              usageCount: countResponse.data.count || 0
            };
          } catch (error) {
            console.error(`Failed to fetch usage count for ${mediaType.name}:`, error);
            return {
              ...mediaType,
              usageCount: 0
            };
          }
        })
      );
      
      console.log('Media types with counts:', mediaTypesWithCounts);
      return mediaTypesWithCounts;
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
      const response = await axios.get(`${env.BASE_URL}/api/media-types/${id}/usage`);
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
      const response = await axios.post(`${env.BASE_URL}/api/media-types/migrate`, {
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
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeMediaTypes.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(initializeMediaTypes.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.mediaTypes = action.payload.map(mediaType => ({
          ...mediaType,
          status: mediaType.status || 'active',
          usageCount: mediaType.usageCount || 0,
          replacedBy: mediaType.replacedBy || null,
          isDeleting: mediaType.isDeleting || false
        }));
        state.error = null;
      })
      .addCase(initializeMediaTypes.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
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
  resetOperation 
} = mediaTypeSlice.actions;

export default mediaTypeSlice.reducer;
