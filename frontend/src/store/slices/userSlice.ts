import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import axios from 'axios';
import type { User } from '../../types/userTypes';
import env from '../../config/env';

export interface CurrentUserState extends User {
  isLoading: boolean;
  error: string | null;
  token: string;
}

interface UsersState {
  allUsers: User[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

interface UserState {
  currentUser: CurrentUserState;
  users: UsersState;
}

const initialState: UserState = {
  currentUser: {
    _id: '',
    id: '',
    email: '',
    firstName: '',
    lastName: '',
    avatar: '',
    username: '',
    role: 'user',
    isLoading: true,
    error: null,
    token: '',
  },
  users: {
    allUsers: [],
    status: 'idle',
    error: null,
  },
};

export const useAuth = () => {
    const user = useSelector((state: RootState) => state.user);
    return { user, isAuthenticated: !!user };
  };

export const fetchAllUsers = createAsyncThunk(
  'user/fetchAllUsers',
  async () => {
    const token = localStorage.getItem('authToken');
    const response = await axios.get<User[]>(`${env.BASE_URL}/api/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Fetched users:', response.data);
    return response.data;
  }
);

export const initializeUser = createAsyncThunk(
  'user/initialize',
  async (_, { dispatch, rejectWithValue, getState }) => {
    // Get the current state
    const state = getState() as { user: UserState };
    
    // Skip the request if user is already fully loaded with a valid ID
    // We don't skip if there was an error or if the user is still loading
    if (state.user.currentUser._id && !state.user.currentUser.isLoading && state.user.currentUser.error === null) {
      console.log('Skipping user profile fetch - already loaded with valid ID:', state.user.currentUser._id);
      return { currentUser: state.user.currentUser };
    }
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No token found');
      }

      // Fetch user profile
      const profileResponse = await axios.get<User>(`${env.BASE_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('Profile response:', profileResponse.data);

      // Transform the flat user object into the expected structure
      const userData = {
        currentUser: {
          ...profileResponse.data,
          isLoading: false,
          error: null,
          token
        }
      };

      // If user is admin or super-admin, also fetch all users
      if (profileResponse.data.role === 'admin' || 
          profileResponse.data.role === 'superAdmin') {
        console.log('User is admin/super-admin, fetching all users');
        // Only check for succeeded status, retry if failed
        if (state.user.users.status !== 'succeeded') {
          dispatch(fetchAllUsers());
        } else {
          console.log('Skipping users fetch - already loaded successfully');
        }
      }

      return userData;
    } catch (error: any) {
      console.error('Failed to initialize user:', error.response?.data || error.message);
      localStorage.removeItem('authToken');
      return rejectWithValue('Failed to initialize user');
    }
  }
);

export const updateUser = createAsyncThunk(
  'user/updateUser',
  async (userData: Partial<User> & { _id: string }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return rejectWithValue('No authentication token found');
      }

      const response = await axios.put(
        `${env.BASE_URL}/api/users/${userData._id}`,
        userData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return response.data;
    } catch (error: any) {
      console.error('Failed to update user:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to update user');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<CurrentUserState>) {
      state.currentUser = { ...action.payload, isLoading: false };
    },
    clearUser(state) {
      state.currentUser = initialState.currentUser;
      state.users = initialState.users;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeUser.pending, (state) => {
        state.currentUser.isLoading = true;
        state.users.status = 'loading';
      })
      .addCase(initializeUser.fulfilled, (state, action) => {
        state.currentUser = {
          ...state.currentUser,
          ...action.payload.currentUser,
          isLoading: false
        };
      })
      .addCase(initializeUser.rejected, (state) => {
        state.currentUser = { ...initialState.currentUser, isLoading: false };
        state.users = initialState.users;
      })
      // Keep these cases for manual fetching if needed
      .addCase(fetchAllUsers.pending, (state) => {
        state.users.status = 'loading';
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.users.status = 'succeeded';
        state.users.allUsers = action.payload;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.users.status = 'failed';
        state.users.error = action.error.message ?? 'An unknown error occurred';
      })
      .addCase(updateUser.pending, () => {
        // Optional loading state for the specific update operation if needed
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        // Update the user in the allUsers array
        const updatedUser = action.payload as User;
        const index = state.users.allUsers.findIndex(user => user._id === updatedUser._id);
        if (index !== -1) {
          state.users.allUsers[index] = updatedUser;
        }
        
        // If the updated user is the current user, update currentUser state as well
        if (state.currentUser._id === updatedUser._id) {
          state.currentUser = { 
            ...state.currentUser,
            ...updatedUser as any
          };
        }
      })
      .addCase(updateUser.rejected, () => {
        // Handle error state if needed
      });
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer; 