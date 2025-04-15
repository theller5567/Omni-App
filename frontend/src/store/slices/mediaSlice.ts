import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { BaseMediaFile } from '../../interfaces/MediaFile';
import env from '../../config/env';

interface MediaState {
  allMedia: BaseMediaFile[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: MediaState = {
  allMedia: [],
  status: 'idle',
  error: null,
};

export const initializeMedia = createAsyncThunk(
  'media/initialize',
  async (_, { getState }) => {
    // Get the current state
    const state = getState() as { media: MediaState };
    
    // Only skip if we have successfully loaded data AND we have actual media items
    if (state.media.status === 'succeeded' && state.media.allMedia.length > 0) {
      console.log('Skipping media fetch - already loaded successfully with', state.media.allMedia.length, 'items');
      return state.media.allMedia;
    }
    
    // If we're currently loading AND there's no data, we should force a reload
    if (state.media.status === 'loading' && state.media.allMedia.length === 0) {
      console.log('Media fetch is in progress, but no data exists yet - continuing with fetch');
    } else if (state.media.status === 'loading') {
      console.log('Skipping media fetch - request already in progress with data');
      return state.media.allMedia;
    }
    
    try {
      console.log('Fetching media from backend');
      const response = await axios.get<BaseMediaFile[]>(`${env.BASE_URL}/media/all`);
      console.log('Media received:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching media:', error);
      throw error;
    }
  }
);

const mediaSlice = createSlice({
  name: 'media',
  initialState,
  reducers: {
    addMedia: (state, action: PayloadAction<BaseMediaFile>) => {
      console.log('Adding media:', action.payload);
      // Ensure consistent date formatting
      const formattedMedia = {
        ...action.payload,
        modifiedDate: action.payload.modifiedDate ? new Date(action.payload.modifiedDate).toISOString() : new Date().toISOString()
      };
      state.allMedia.unshift(formattedMedia); // Add to beginning of array for better visibility
    },
    updateMedia: (state, action: PayloadAction<BaseMediaFile>) => {
      console.log('Updating media:', action.payload);
      const index = state.allMedia.findIndex(media => media._id === action.payload._id);
      if (index !== -1) {
        state.allMedia[index] = action.payload;
      }
    },
    deleteMedia: (state, action: PayloadAction<string>) => {
      console.log('Deleting media:', action.payload);
      state.allMedia = state.allMedia.filter(media => media._id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeMedia.pending, (state) => {
        console.log('Media initialization pending...');
        state.status = 'loading';
      })
      .addCase(initializeMedia.fulfilled, (state, action) => {
        console.log('Media initialization succeeded:', action.payload);
        state.status = 'succeeded';
        state.allMedia = action.payload.map(media => ({
          ...media,
          modifiedDate: media.modifiedDate ? new Date(media.modifiedDate).toISOString() : new Date().toISOString()
        }));
      })
      .addCase(initializeMedia.rejected, (state, action) => {
        console.error('Media initialization failed:', action.payload);
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const { addMedia, updateMedia, deleteMedia } = mediaSlice.actions;
export default mediaSlice.reducer; 