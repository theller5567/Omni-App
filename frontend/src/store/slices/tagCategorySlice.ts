import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import env from '../../config/env';
import { RootState } from '../store';

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
}

const initialState: TagCategoryState = {
  tagCategories: [],
  status: 'idle',
  error: null,
  lastFetchTime: null
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
const getRequestConfig = (token: string, additionalParams: Record<string, string> = {}) => {
  const timestamp = new Date().getTime();
  const params: RequestParams = {
    _t: timestamp.toString(),
    ...additionalParams
  };
  
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

export const fetchTagCategories = createAsyncThunk<TagCategory[], { includeInactive?: boolean } | undefined>(
  'tagCategories/fetchAll',
  async (options, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.user.currentUser.token;
      
      console.log('Fetching all tag categories', options ? `with options: ${JSON.stringify(options)}` : '');
      
      // Add optional query params
      const additionalParams: Record<string, string> = {};
      if (options?.includeInactive) {
        additionalParams.includeInactive = 'true';
        console.log('Including inactive categories in fetch request');
      }
      
      const config = getRequestConfig(token, additionalParams);
      const response = await axios.get<TagCategory[]>(`${env.BASE_URL}/api/tag-categories`, config);
      
      console.log('Tag categories fetched:', response.data.length);
      if (response.data.length > 0) {
        console.log('First category:', {
          id: response.data[0]._id,
          name: response.data[0].name,
          isActive: response.data[0].isActive
        });
      }
      return response.data;
    } catch (error: any) {
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

export const createTagCategory = createAsyncThunk(
  'tagCategories/create',
  async (data: { 
    name: string, 
    description?: string, 
    tags: Array<{ id: string, name: string }> 
  }, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.user.currentUser.token;
      
      // First, clear cache and get the latest data to check for duplicates
      console.log('Refreshing tag categories before creating new one');
      try {
        await dispatch(fetchTagCategories()).unwrap();
      } catch (refreshError) {
        console.warn('Error refreshing tag categories before create:', refreshError);
        // Continue anyway - the backend will still check for duplicates
      }
      
      // Check for duplicates in the fresh data
      const updatedState = getState() as RootState;
      const existingCategory = updatedState.tagCategories.tagCategories.find(
        cat => cat.name.toLowerCase() === data.name.toLowerCase()
      );
      
      if (existingCategory) {
        console.log(`Tag category "${data.name}" already exists in state, returning existing category`);
        return existingCategory;
      }
      
      // Proceed with creation if no duplicate found
      console.log('Creating tag category:', data);
      
      const config = getRequestConfig(token);
      
      // Only send tags array, no tagIds
      const payload = {
        name: data.name,
        description: data.description,
        tags: data.tags
      };
      
      const response = await axios.post<TagCategory>(`${env.BASE_URL}/api/tag-categories`, payload, config);
      
      console.log('Tag category created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating tag category:', error.response?.status, error.response?.data);
      // Handle duplicate name error specifically
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        return rejectWithValue(`Category "${data.name}" already exists. Please use a different name.`);
      }
      return rejectWithValue(handleAsyncError(error));
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
  }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = state.user.currentUser.token;
      
      console.log('Updating tag category:', id, data);
      
      const config = getRequestConfig(token);
      
      // Only use the data as provided, no tagIds derivation
      const response = await axios.put<TagCategory>(`${env.BASE_URL}/api/tag-categories/${id}`, data, config);
      
      console.log('Tag category updated:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating tag category:', error.response?.status, error.response?.data);
      
      // Handle common errors
      if (error.response?.status === 404) {
        return rejectWithValue('Tag category not found. It may have been deleted.');
      }
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        return rejectWithValue(`Category name already exists. Please use a different name.`);
      }
      
      return rejectWithValue(handleAsyncError(error));
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
  async (params: DeleteTagCategoryParams, { getState, rejectWithValue }) => {
    const { id, hardDelete } = params;
    try {
      console.log(`Deleting tag category ${id}${hardDelete ? ' (hard delete)' : ''}`);
      
      const state = getState() as RootState;
      const token = state.user.currentUser.token;
      
      // Get base request config
      const config = getRequestConfig(token);
      
      // Add query parameter for hard delete if requested
      if (hardDelete) {
        config.params = {
          ...config.params,
          hard: 'true'
        };
      }
      
      await axios.delete(`${env.BASE_URL}/api/tag-categories/${id}`, config);
      
      console.log('Tag category deleted successfully:', id);
      return id;
    } catch (error: any) {
      console.error('Error deleting tag category:', error);
      
      // Special case for 404 errors, which might mean the tag category was already deleted
      if (error.response && error.response.status === 404) {
        console.log('Tag category not found (may have been already deleted)');
        return id; // Return ID to remove from state
      }
      
      return rejectWithValue(handleAsyncError(error));
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
      
      // Log the state reset
      console.log('Tag category state has been completely reset');
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

export const { clearTagCategoryErrors, resetTagCategories } = tagCategorySlice.actions;
export default tagCategorySlice.reducer;