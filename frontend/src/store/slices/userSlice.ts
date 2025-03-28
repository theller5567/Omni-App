import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import axios from 'axios';

export interface User {
  _id: string;
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  username: string;
  role: string;
}

export interface CurrentUserState {
  _id: string;
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  username: string;
  role: string;
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
    role: '',
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

export const fetchAllUsers = createAsyncThunk<User[], void>('http://localhost:5002/api/users/fetchAll', async () => {
  const response = await axios.get('http://localhost:5002/api/users');
  console.log('response.data', response.data);
  return response.data as User[];
});

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<CurrentUserState>) {
      state.currentUser = { ...action.payload, isLoading: false };
    },
    clearUser(state) {
      state.currentUser = initialState.currentUser;
    },
  },
  extraReducers: (builder) => {
    builder
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