import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import axios from 'axios';
import type { User } from '../../types/userTypes';

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
    const response = await axios.get<User[]>('http://localhost:5002/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Fetched users:', response.data);
    return response.data;
  }
);

export const initializeUser = createAsyncThunk(
  'user/initialize',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No token found');
      }

      // Fetch user profile
      const profileResponse = await axios.get<User>('http://localhost:5002/api/user/profile', {
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
        dispatch(fetchAllUsers());
      }

      return userData;
    } catch (error: any) {
      console.error('Failed to initialize user:', error.response?.data || error.message);
      localStorage.removeItem('authToken');
      return rejectWithValue('Failed to initialize user');
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
      });
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer; 