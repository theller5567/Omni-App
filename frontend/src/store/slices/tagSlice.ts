import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:5002/api';

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

export const fetchTags = createAsyncThunk<Tags[], void>('http://localhost:5002/api/tags/fetchTags', async () => {
  console.log('Fetching tags');
  const response = await axios.get<Tags[]>(`http://localhost:5002/api/tags`);
  console.log('Tags fetched:', response.data);
  return response.data;
});

export const addTag = createAsyncThunk<Tags, string>('http://localhost:5002/api/tags/addTag', async (name) => {
  console.log('Adding tag');
  const response = await axios.post<Tags>(`${axios.defaults.baseURL}/tags`, { name });
  return response.data;
});

export const updateTag = createAsyncThunk<Tags, { id: string; name: string }>('http://localhost:5002/api/tags/updateTag', async ({ id, name }) => {
  console.log('Updating tag');
  const response = await axios.put<Tags>(`${axios.defaults.baseURL}/tags/${id}`, { name });
  return response.data;
});

export const deleteTag = createAsyncThunk<string, string>('http://localhost:5002/api/tags/deleteTag', async (id) => {
  console.log('Deleting tag');
  await axios.delete(`${axios.defaults.baseURL}/tags/${id}`);
  return id;
});

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
      });
  },
});

export default tagSlice.reducer;
