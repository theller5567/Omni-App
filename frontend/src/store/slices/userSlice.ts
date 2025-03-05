import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

interface UserState {
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
}

const initialState: UserState = {
  email: '',
  firstName: '',
  lastName: '',
  avatar: '',
};

export const useAuth = () => {
    const user = useSelector((state: RootState) => state.user);
    return { user, isAuthenticated: !!user };
  };

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<UserState>) {
      return { ...state, ...action.payload };
    },
    clearUser(state) {
      state.email = '';
      state.firstName = '';
      state.lastName = '';
      state.avatar = '';
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer; 