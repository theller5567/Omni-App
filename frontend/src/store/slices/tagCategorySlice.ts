import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import env from '../../config/env';
import { RootState } from '../store';
import { toast } from 'react-toastify';
import { PayloadAction } from '@reduxjs/toolkit';

export interface TagCategory {
  _id: string;
  name: string;
  description?: string;
  tags?: Array<{
    id: string;
    name: string;
  }>;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface TagCategoryState {
  tagCategories: TagCategory[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  lastFetchTime: number | null;
  pendingOperations: string[]; // Changed from Set<string> to string[] array
  lastOperation: {
    type: 'none' | 'fetch' | 'create' | 'update' | 'delete';
    id: string | null;
    status: 'idle' | 'pending' | 'success' | 'error';
    timestamp: number;
  };
}

const initialState: TagCategoryState = {
  tagCategories: [],
  status: 'idle',
  error: null,
  lastFetchTime: null,
  pendingOperations: [], // Changed from Set to array
  lastOperation: {
    type: 'none',
    id: null,
    status: 'idle',
    timestamp: 0
  }
};

// Add error handling for all async thunks
const handleAsyncError = (error: any) => {
  console.error('Tag category API error:', error);
  
  // Detailed error information
  let errorMessage = 'An unknown error occurred';
  
  if (error.response) {
    // The request was made and the server responded with an error
    console.error('Response data:', error.response.data);
    console.error('Response status:', error.response.status);
    
    errorMessage = error.response.data?.message || 
                  `Server error: ${error.response.status}`;
  } else if (error.request) {
    // The request was made but no response was received
    console.error('No response received:', error.request);
    errorMessage = 'No response received from server';
  } else {
    // Something happened in setting up the request
    console.error('Request setup error:', error.message);
    errorMessage = error.message || 'Request failed';
  }
  
  return errorMessage;
};

// Define a type for request params
interface RequestParams {
  _t: string;
  [key: string]: string;  // Allow any string key with string value
}

// Helper function to add timestamp and cache-busting headers
const getRequestConfig = (additionalParams: Record<string, string> = {}) => {
  const timestamp = new Date().getTime();
  const params: RequestParams = {
    _t: timestamp.toString(),
    ...additionalParams
  };
  
  const token = localStorage.getItem('authToken');
  
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    params
  };
};

const generateOperationId = (type: string, id?: string) => {
  return `${type}-${id || 'all'}-${Date.now()}`;
};

export const fetchTagCategories = createAsyncThunk<TagCategory[], { includeInactive?: boolean } | undefined>(
  'tagCategories/fetchAll',
  async (options, { rejectWithValue, dispatch }) => {
    const operationId = generateOperationId('fetch');
    dispatch(tagCategorySlice.actions.operationStarted({
      type: 'fetch',
      id: operationId
    }));
    
    try {
      console.log('Fetching all tag categories', options ? `with options: ${JSON.stringify(options)}` : '');
      
      // Add optional query params
      const additionalParams: Record<string, string> = {};
      if (options?.includeInactive) {
        additionalParams.includeInactive = 'true';
        console.log('Including inactive categories in fetch request');
      }
      
      const config = getRequestConfig(additionalParams);
      const response = await axios.get<TagCategory[]>(`${env.BASE_URL}/api/tag-categories`, config);
      
      console.log('Tag categories fetched:', response.data.length);
      if (response.data.length > 0) {
        console.log('First category:', {
          id: response.data[0]._id,
          name: response.data[0].name,
          isActive: response.data[0].isActive
        });
      }
      
      dispatch(tagCategorySlice.actions.operationCompleted({
        type: 'fetch',
        id: operationId,
        status: 'success'
      }));
      
      return response.data;
    } catch (error: any) {
      dispatch(tagCategorySlice.actions.operationCompleted({
        type: 'fetch',
        id: operationId,
        status: 'error'
      }));
      return rejectWithValue(handleAsyncError(error));
    }
  }
);

// Add a new thunk to force fetch all categories including inactive ones
export const forceRefreshAllCategories = createAsyncThunk<TagCategory[]>(
  'tagCategories/forceRefreshAll',
  async (_, { dispatch }) => {
    console.log('Force refreshing ALL tag categories (including inactive)');
    
    // Clear the Redux store first
    dispatch(resetTagCategories());
    
    // Fetch all categories including inactive ones
    const result = await dispatch(fetchTagCategories({ includeInactive: true })).unwrap();
    console.log(`Forced refresh complete, loaded ${result.length} categories`);
    
    return result;
  }
);

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

export const createTagCategory = createAsyncThunk(
  'tagCategories/create',
  async (data: { 
    name: string, 
    description?: string, 
    tags: Array<{ id: string, name: string }> 
  }, { dispatch, rejectWithValue }) => {
    const operationId = generateOperationId('create', data.name);
    dispatch(tagCategorySlice.actions.operationStarted({
      type: 'create',
      id: operationId
    }));
    
    try {
      // First, clear cache and get the latest data to check for duplicates
      console.log('Refreshing tag categories before creating new one');
      try {
        await dispatch(fetchTagCategories()).unwrap();
      } catch (refreshError) {
        console.warn('Error refreshing tag categories before create:', refreshError);
        // Continue anyway - the backend will still check for duplicates
      }
      
      // Proceed with creation
      console.log('Creating tag category:', data);
      
      const config = getRequestConfig();
      
      // Only send tags array, no tagIds
      const payload = {
        name: data.name,
        description: data.description,
        tags: data.tags
      };
      
      const response = await axios.post<TagCategory>(`${env.BASE_URL}/api/tag-categories`, payload, config);
      
      console.log('Tag category created:', response.data);
      
      dispatch(tagCategorySlice.actions.operationCompleted({
        type: 'create',
        id: operationId,
        status: 'success'
      }));
      
      // Show immediate success toast
      showToastDirectly('success', `Category "${data.name}" created successfully`);
      
      return response.data;
    } catch (error: any) {
      dispatch(tagCategorySlice.actions.operationCompleted({
        type: 'create',
        id: operationId,
        status: 'error'
      }));
      
      console.error('Error creating tag category:', error.response?.status, error.response?.data);
      // Handle duplicate name error specifically
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        const errorMessage = `Category "${data.name}" already exists. Please use a different name.`;
        showToastDirectly('error', errorMessage);
        return rejectWithValue(errorMessage);
      }
      
      const errorMessage = handleAsyncError(error);
      showToastDirectly('error', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateTagCategory = createAsyncThunk(
  'tagCategories/update',
  async ({ id, data }: { 
    id: string, 
    data: { 
      name?: string, 
      description?: string, 
      tags: Array<{ id: string, name: string }> 
    } 
  }, { dispatch, rejectWithValue }) => {
    const operationId = generateOperationId('update', id);
    dispatch(tagCategorySlice.actions.operationStarted({
      type: 'update',
      id: operationId
    }));
    
    try {
      console.log('Updating tag category:', id, data);
      
      const config = getRequestConfig();
      
      // Only use the data as provided, no tagIds derivation
      const response = await axios.put<TagCategory>(`${env.BASE_URL}/api/tag-categories/${id}`, data, config);
      
      console.log('Tag category updated:', response.data);
      
      dispatch(tagCategorySlice.actions.operationCompleted({
        type: 'update',
        id: operationId,
        status: 'success'
      }));
      
      // Show immediate success toast
      showToastDirectly('success', `Category "${data.name || 'Unknown'}" updated successfully`);
      
      return response.data;
    } catch (error: any) {
      dispatch(tagCategorySlice.actions.operationCompleted({
        type: 'update',
        id: operationId,
        status: 'error'
      }));
      
      console.error('Error updating tag category:', error.response?.status, error.response?.data);
      
      // Handle common errors
      if (error.response?.status === 404) {
        const errorMessage = 'Tag category not found. It may have been deleted.';
        showToastDirectly('error', errorMessage);
        return rejectWithValue(errorMessage);
      }
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        const errorMessage = `Category name already exists. Please use a different name.`;
        showToastDirectly('error', errorMessage);
        return rejectWithValue(errorMessage);
      }
      
      const errorMessage = handleAsyncError(error);
      showToastDirectly('error', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// Add an interface for the delete params
interface DeleteTagCategoryParams {
  id: string;
  hardDelete?: boolean;
}

export const deleteTagCategory = createAsyncThunk(
  'tagCategories/deleteTagCategory',
  async (params: DeleteTagCategoryParams, { dispatch, getState, rejectWithValue }) => {
    const { id, hardDelete } = params;
    const operationId = generateOperationId('delete', id);
    dispatch(tagCategorySlice.actions.operationStarted({
      type: 'delete',
      id: operationId
    }));
    
    // Get category name for better notification
    const state = getState() as RootState;
    const categoryToDelete = state.tagCategories.tagCategories.find(cat => cat._id === id);
    const categoryName = categoryToDelete?.name || 'Category';
    
    try {
      console.log(`Deleting tag category ${id}${hardDelete ? ' (hard delete)' : ''}`);
      
      // Get base request config
      const config = getRequestConfig();
      
      // Add query parameter for hard delete if requested
      if (hardDelete) {
        config.params = {
          ...config.params,
          hard: 'true'
        };
      }
      
      await axios.delete(`${env.BASE_URL}/api/tag-categories/${id}`, config);
      
      console.log('Tag category deleted successfully:', id);
      
      dispatch(tagCategorySlice.actions.operationCompleted({
        type: 'delete',
        id: operationId,
        status: 'success'
      }));
      
      // Show immediate success toast
      if (hardDelete) {
        showToastDirectly('success', `${categoryName} has been permanently deleted`);
      } else {
        showToastDirectly('success', `${categoryName} has been moved to inactive categories`);
      }
      
      return id;
    } catch (error: any) {
      dispatch(tagCategorySlice.actions.operationCompleted({
        type: 'delete',
        id: operationId,
        status: 'error'
      }));
      
      console.error('Error deleting tag category:', error);
      
      // Special case for 404 errors, which might mean the tag category was already deleted
      if (error.response && error.response.status === 404) {
        console.log('Tag category not found (may have been already deleted)');
        return id; // Return ID to remove from state
      }
      
      const errorMessage = handleAsyncError(error);
      showToastDirectly('error', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

const tagCategorySlice = createSlice({
  name: 'tagCategories',
  initialState,
  reducers: {
    clearTagCategoryErrors: (state) => {
      state.error = null;
    },
    resetTagCategories: (state) => {
      console.log('Resetting tag categories state completely');
      
      // Clear all data
      state.tagCategories = [];
      state.status = 'idle';
      state.error = null;
      state.lastFetchTime = null;
      state.pendingOperations = []; // Changed from Set to array
      state.lastOperation = {
        type: 'none',
        id: null,
        status: 'idle',
        timestamp: 0
      };
      
      // Log the state reset
      console.log('Tag category state has been completely reset');
    },
    operationStarted: (state, action: PayloadAction<{ type: 'fetch' | 'create' | 'update' | 'delete', id: string }>) => {
      console.log(`Operation started: ${action.payload.type} (${action.payload.id})`);
      if (!state.pendingOperations.includes(action.payload.id)) {
        state.pendingOperations.push(action.payload.id); // Use array push instead of Set.add
      }
      state.lastOperation = {
        type: action.payload.type,
        id: action.payload.id,
        status: 'pending',
        timestamp: Date.now()
      };
    },
    operationCompleted: (state, action: PayloadAction<{ 
      type: 'fetch' | 'create' | 'update' | 'delete', 
      id: string,
      status: 'success' | 'error'
    }>) => {
      console.log(`Operation completed: ${action.payload.type} (${action.payload.id}) - ${action.payload.status}`);
      // Filter out the completed operation ID instead of using Set.delete
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
      .addCase(fetchTagCategories.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchTagCategories.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.tagCategories = action.payload;
        state.lastFetchTime = Date.now();
      })
      .addCase(fetchTagCategories.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch tag categories';
      })
      .addCase(createTagCategory.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createTagCategory.fulfilled, (state, action) => {
        // If we don't already have this category, add it
        if (!state.tagCategories.some(cat => cat._id === action.payload._id)) {
          state.tagCategories.push(action.payload);
        }
        state.status = 'succeeded';
      })
      .addCase(createTagCategory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string || 'Failed to create tag category';
      })
      .addCase(updateTagCategory.fulfilled, (state, action) => {
        const index = state.tagCategories.findIndex(cat => cat._id === action.payload._id);
        if (index !== -1) {
          state.tagCategories[index] = action.payload;
        }
        state.status = 'succeeded';
      })
      .addCase(deleteTagCategory.fulfilled, (state, action) => {
        state.tagCategories = state.tagCategories.filter(cat => cat._id !== action.payload);
        state.status = 'succeeded';
      });
  }
});

export const { clearTagCategoryErrors, resetTagCategories, operationStarted, operationCompleted } = tagCategorySlice.actions;
export default tagCategorySlice.reducer;