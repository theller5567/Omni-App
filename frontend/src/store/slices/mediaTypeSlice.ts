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
}

interface MediaTypeState {
  mediaTypes: MediaType[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: MediaTypeState = {
  mediaTypes: [],
  status: 'idle',
  error: null
};

export const initializeMediaTypes = createAsyncThunk(
  'mediaTypes/initialize',
  async () => {
    try {
      console.log('Fetching media types from backend');
      const response = await axios.get<MediaType[]>(`${env.BASE_URL}/api/media-types`);
      console.log('Media types received:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching media types:', error);
      throw error;
    }
  }
);

const mediaTypeSlice = createSlice({
  name: 'mediaTypes',
  initialState,
  reducers: {
    addMediaType: (state, action: PayloadAction<MediaType>) => {
      state.mediaTypes.push(action.payload);
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
        state.mediaTypes = action.payload;
        state.error = null;
      })
      .addCase(initializeMediaTypes.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const { addMediaType } = mediaTypeSlice.actions;
export default mediaTypeSlice.reducer;
