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
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get<BaseMediaFile[]>(`${env.BASE_URL}/media/all`);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch media';
      console.error('Error fetching media:', message);
      return rejectWithValue(message);
    }
  }
);

export const updateMedia = createAsyncThunk(
  'media/updateMedia',
  async (mediaData: Partial<BaseMediaFile>, { rejectWithValue }) => {
    try {
      console.log('Updating media with data:', mediaData);
      const mediaId = mediaData._id || '';
      const mediaSlug = mediaData.slug || '';
      
      if (!mediaId && !mediaSlug) {
        return rejectWithValue('Missing media ID or slug');
      }
      
      // Prepare the update payload
      const updatePayload = {
        title: mediaData.title,
        metadata: mediaData.metadata ? {
          // Ensure we spread all fields properly
          ...mediaData.metadata
        } : undefined
      };
      
      console.log('Server update payload:', JSON.stringify(updatePayload, null, 2));
      
      let response;
      
      // Get the auth token from localStorage
      const token = localStorage.getItem('authToken');
      
      // Set up the headers with authorization
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      };
      
      // Try the ID endpoint first
      try {
        console.log('Trying to update media using ID endpoint');
        response = await axios.put<BaseMediaFile>(
          `${env.BASE_URL}/media/update-by-id/${mediaId}`,
          updatePayload,
          { headers }
        );
      } catch (error: any) {
        // If ID endpoint fails with 404, try the slug endpoint
        if (error.response && error.response.status === 404 && mediaSlug) {
          console.log('ID endpoint failed, trying slug endpoint');
          response = await axios.put<BaseMediaFile>(
            `${env.BASE_URL}/media/update/${mediaSlug}`,
            updatePayload,
            { headers }
          );
        } else {
          // Re-throw the error if it's not a 404 or we don't have a slug
          throw error;
        }
      }
      
      console.log('Media update response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating media:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to update media');
    }
  }
);

// Add new thunk for deleting media with authorization
export const deleteMediaThunk = createAsyncThunk(
  'media/deleteMediaThunk',
  async (mediaId: string, { rejectWithValue }) => {
    try {
      console.log('Deleting media with ID:', mediaId);
      
      // Get the auth token from localStorage
      const token = localStorage.getItem('authToken');
      
      // Set up the headers with authorization
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      };
      
      // Make the API call to delete the media
      const response = await axios.delete<{ message: string, deletedId: string }>(
        `${env.BASE_URL}/media/delete/${mediaId}`,
        { headers }
      );
      
      console.log('Media delete response:', response.data);
      return response.data.deletedId;
    } catch (error: any) {
      console.error('Error deleting media:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to delete media');
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
    updateMediaLocal: (state, action: PayloadAction<BaseMediaFile>) => {
      console.log('Updating media locally:', action.payload);
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
      })
      .addCase(updateMedia.pending, (state) => {
        console.log('Media update pending...');
      })
      .addCase(updateMedia.fulfilled, (state, action) => {
        console.log('Media update succeeded:', action.payload);
        const index = state.allMedia.findIndex(media => media._id === action.payload._id);
        if (index !== -1) {
          state.allMedia[index] = action.payload;
        }
      })
      .addCase(updateMedia.rejected, (state, action) => {
        console.error('Media update failed:', action.payload);
        state.error = action.payload as string;
      })
      .addCase(deleteMediaThunk.pending, (state) => {
        console.log('Media delete pending...');
      })
      .addCase(deleteMediaThunk.fulfilled, (state, action) => {
        console.log('Media delete succeeded:', action.payload);
        state.allMedia = state.allMedia.filter(media => media._id !== action.payload);
      })
      .addCase(deleteMediaThunk.rejected, (state, action) => {
        console.error('Media delete failed:', action.payload);
        state.error = action.payload as string;
      });
  },
});

export const { addMedia, updateMediaLocal, deleteMedia } = mediaSlice.actions;
export default mediaSlice.reducer; 