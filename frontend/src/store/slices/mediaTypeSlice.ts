import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

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
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get<MediaType[]>('http://localhost:5002/api/media-types');
      return response.data;
    } catch (error) {
      return rejectWithValue('Failed to fetch media types');
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
