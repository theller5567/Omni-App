import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import apiClient from '../../api/apiClient';
import env from '../../config/env';
import { toast } from 'react-toastify';

// Helper function for immediate toast display
const showToastDirectly = (type: 'success' | 'error', message: string) => {
  toast[type](message, {
    position: 'top-right',
    autoClose: 3000,
    delay: 0,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  });
};

interface Tags {
  _id: string;
  name: string;
}

interface TagsState {
  name: string;
  tags: Tags[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  lastFetchTime: number | null;
  pendingOperations: string[];
  lastOperation: {
    type: 'none' | 'fetch' | 'add' | 'update' | 'delete';
    id: string | null;
    status: 'idle' | 'pending' | 'success' | 'error';
    timestamp: number;
  };
}

const initialState: TagsState = {
  name: '',
  tags: [],
  status: 'idle',
  error: null,
  lastFetchTime: null,
  pendingOperations: [],
  lastOperation: {
    type: 'none',
    id: null,
    status: 'idle',
    timestamp: 0
  }
};

// Helper function to generate operation IDs
const generateOperationId = (type: string, id?: string) => {
  return `${type}-${id || 'all'}-${Date.now()}`;
};

// Helper to check if an operation is pending
const isOperationPending = (operations: string[], operationId: string): boolean => {
  return operations.includes(operationId);
};

export const fetchTags = createAsyncThunk<Tags[], void>(
  'tags/fetchTags', 
  async (_, { dispatch, getState }) => {
    const state = getState() as { tags: TagsState };
    
    // Skip if a fetch operation is already in progress
    const hasPendingFetch = state.tags.pendingOperations.some(id => id.startsWith('fetch-'));
    if (hasPendingFetch) {
      console.log('Skipping tag fetch - already in progress');
      return state.tags.tags;
    }
    
    // Skip fetching if data is already loaded and recent
    const now = Date.now();
    if (state.tags.status === 'succeeded' && 
        state.tags.tags.length > 0 && 
        state.tags.lastFetchTime && 
        now - state.tags.lastFetchTime < 3000) {
      console.log('Skipping tag fetch - already loaded recently (less than 3 seconds ago)');
      return state.tags.tags;
    }
    
    const operationId = generateOperationId('fetch');
    dispatch(tagSlice.actions.operationStarted({
      type: 'fetch',
      id: operationId
    }));
    
    try {
      console.log('Fetching tags');
      const response = await apiClient.get<Tags[]>('/tags');
      console.log('Tags fetched:', response.data);
      
      dispatch(tagSlice.actions.operationCompleted({
        type: 'fetch',
        id: operationId,
        status: 'success'
      }));
      
      return response.data;
    } catch (error) {
      console.error('Error fetching tags:', error);
      
      dispatch(tagSlice.actions.operationCompleted({
        type: 'fetch',
        id: operationId,
        status: 'error'
      }));
      
      throw error;
    }
  }
);

export const addTag = createAsyncThunk<Tags, string>(
  'tags/addTag', 
  async (name, { dispatch, rejectWithValue }) => {
    const operationId = generateOperationId('add', name);
    dispatch(tagSlice.actions.operationStarted({
      type: 'add',
      id: operationId
    }));
    
    try {
      console.log('Adding tag:', name);
      const response = await apiClient.post<Tags>('/tags', { name });
      
      dispatch(tagSlice.actions.operationCompleted({
        type: 'add',
        id: operationId,
        status: 'success'
      }));
      
      // Show immediate toast notification
      showToastDirectly('success', `Tag "${name}" added successfully`);
      
      return response.data;
    } catch (error: any) {
      console.error('Error adding tag:', error);
      
      dispatch(tagSlice.actions.operationCompleted({
        type: 'add',
        id: operationId,
        status: 'error'
      }));
      
      const errorMessage = error.response?.data?.message || 'Failed to add tag';
      showToastDirectly('error', errorMessage);
      
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateTag = createAsyncThunk<Tags, { id: string; name: string }>(
  'tags/updateTag', 
  async ({ id, name }, { dispatch, rejectWithValue }) => {
    const operationId = generateOperationId('update', id);
    dispatch(tagSlice.actions.operationStarted({
      type: 'update',
      id: operationId
    }));
    
    try {
      console.log('Updating tag:', id, name);
      const response = await apiClient.put<Tags>(`/tags/${id}`, { name });
      
      dispatch(tagSlice.actions.operationCompleted({
        type: 'update',
        id: operationId,
        status: 'success'
      }));
      
      // Show immediate toast notification
      showToastDirectly('success', `Tag updated to "${name}" successfully`);
      
      return response.data;
    } catch (error: any) {
      console.error('Error updating tag:', error);
      
      dispatch(tagSlice.actions.operationCompleted({
        type: 'update',
        id: operationId,
        status: 'error'
      }));
      
      const errorMessage = error.response?.data?.message || 'Failed to update tag';
      showToastDirectly('error', errorMessage);
      
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteTag = createAsyncThunk<string, string>(
  'tags/deleteTag', 
  async (id, { dispatch, getState, rejectWithValue }) => {
    const operationId = generateOperationId('delete', id);
    dispatch(tagSlice.actions.operationStarted({
      type: 'delete',
      id: operationId
    }));
    
    // Get the tag name for better notification message
    const state = getState() as { tags: TagsState };
    const tagToDelete = state.tags.tags.find(tag => tag._id === id);
    const tagName = tagToDelete?.name || 'Tag';
    
    try {
      console.log('Deleting tag with ID:', id);
      await apiClient.delete(`/tags/${id}`);
      
      dispatch(tagSlice.actions.operationCompleted({
        type: 'delete',
        id: operationId,
        status: 'success'
      }));
      
      // Show immediate toast notification
      showToastDirectly('success', `Tag "${tagName}" deleted successfully`);
      
      return id;
    } catch (error: any) {
      console.error('Error deleting tag:', error.response?.status, error.response?.data);
      
      dispatch(tagSlice.actions.operationCompleted({
        type: 'delete',
        id: operationId,
        status: 'error'
      }));
      
      // If it's a 404, we consider it as if the tag is already deleted
      if (error.response?.status === 404) {
        console.log('Tag not found (may have been already deleted)');
        // Still return the ID to remove it from the local state
        return id;
      }
      
      const errorMessage = error.response?.data?.message || 'Failed to delete tag';
      showToastDirectly('error', errorMessage);
      
      return rejectWithValue(errorMessage);
    }
  }
);

const tagSlice = createSlice({
  name: 'tags',
  initialState,
  reducers: {
    resetTags: (state) => {
      state.tags = [];
      state.status = 'idle';
      state.error = null;
      state.lastFetchTime = null;
      state.pendingOperations = [];
      state.lastOperation = {
        type: 'none',
        id: null,
        status: 'idle',
        timestamp: 0
      };
    },
    operationStarted: (state, action: PayloadAction<{ type: 'fetch' | 'add' | 'update' | 'delete', id: string }>) => {
      console.log(`Tag operation started: ${action.payload.type} (${action.payload.id})`);
      if (!state.pendingOperations.includes(action.payload.id)) {
        state.pendingOperations.push(action.payload.id);
      }
      state.lastOperation = {
        type: action.payload.type,
        id: action.payload.id,
        status: 'pending',
        timestamp: Date.now()
      };
    },
    operationCompleted: (state, action: PayloadAction<{ 
      type: 'fetch' | 'add' | 'update' | 'delete', 
      id: string,
      status: 'success' | 'error'
    }>) => {
      console.log(`Tag operation completed: ${action.payload.type} (${action.payload.id}) - ${action.payload.status}`);
      state.pendingOperations = state.pendingOperations.filter(id => id !== action.payload.id);
      state.lastOperation = {
        type: action.payload.type,
        id: action.payload.id,
        status: action.payload.status,
        timestamp: Date.now()
      };
    }
  },
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
        state.lastFetchTime = Date.now();
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

export const { resetTags, operationStarted, operationCompleted } = tagSlice.actions;
export default tagSlice.reducer;
