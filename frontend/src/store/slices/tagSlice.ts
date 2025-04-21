import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import env from '../../config/env';

axios.defaults.baseURL = `${env.BASE_URL}/api`;

interface Tags {
  _id: string;
  name: string;
}

interface TagsState {
  name: string;
  tags: Tags[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: TagsState = {
  name: '',
  tags: [],
  status: 'idle',
  error: null,
};

export const fetchTags = createAsyncThunk<Tags[], void>('tags/fetchTags', async () => {
  console.log('Fetching tags');
  const response = await axios.get<Tags[]>(`${env.BASE_URL}/api/tags`);
  console.log('Tags fetched:', response.data);
  return response.data;
});

export const addTag = createAsyncThunk<Tags, string>('tags/addTag', async (name) => {
  console.log('Adding tag');
  const response = await axios.post<Tags>(`${axios.defaults.baseURL}/tags`, { name });
  return response.data;
});

export const updateTag = createAsyncThunk<Tags, { id: string; name: string }>('tags/updateTag', async ({ id, name }) => {
  console.log('Updating tag');
  const response = await axios.put<Tags>(`${axios.defaults.baseURL}/tags/${id}`, { name });
  return response.data;
});

export const deleteTag = createAsyncThunk<string, string>(
  'tags/deleteTag', 
  async (id, { rejectWithValue }) => {
    try {
      console.log('Deleting tag with ID:', id);
      await axios.delete(`${axios.defaults.baseURL}/tags/${id}`);
      return id;
    } catch (error: any) {
      console.error('Error deleting tag:', error.response?.status, error.response?.data);
      // If it's a 404, we consider it as if the tag is already deleted
      if (error.response?.status === 404) {
        console.log('Tag not found (may have been already deleted)');
        // Still return the ID to remove it from the local state
        return id;
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to delete tag');
    }
  }
);

const tagSlice = createSlice({
  name: 'tags',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTags.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchTags.fulfilled, (state, action: PayloadAction<Tags[]>) => {
        state.tags = action.payload;
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(fetchTags.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to fetch tags';
      })
      .addCase(addTag.fulfilled, (state, action: PayloadAction<Tags>) => {
        state.tags.push(action.payload);
      })
      .addCase(updateTag.fulfilled, (state, action: PayloadAction<Tags>) => {
        const index = state.tags.findIndex((tag: Tags) => tag._id === action.payload._id);
        if (index !== -1) {
          state.tags[index] = action.payload;
        }
      })
      .addCase(deleteTag.fulfilled, (state, action: PayloadAction<string>) => {
        state.tags = state.tags.filter((tag: Tags) => tag._id !== action.payload);
      })
      .addCase(deleteTag.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'Failed to delete tag';
        console.error('Delete tag failed with error:', action.error);
      });
  },
});

export default tagSlice.reducer;
