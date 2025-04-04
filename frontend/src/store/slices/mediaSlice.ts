import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { BaseMediaFile } from '../../interfaces/MediaFile';

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
  async (_, { rejectWithValue }) => {
    try {
      console.log('Fetching media from backend...');
      const response = await axios.get<BaseMediaFile[]>('http://localhost:5002/media/all');
      console.log('Media fetch response:', response.data);
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Invalid media data format:', response.data);
        return rejectWithValue('Invalid media data format');
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching media:', error);
      return rejectWithValue('Failed to fetch media');
    }
  }
);

const mediaSlice = createSlice({
  name: 'media',
  initialState,
  reducers: {
    addMedia: (state, action: PayloadAction<BaseMediaFile>) => {
      console.log('Adding media:', action.payload);
      state.allMedia.push(action.payload);
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