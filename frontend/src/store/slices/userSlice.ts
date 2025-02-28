import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  name: string;
  email: string;
  // Add other user fields as needed
}

interface UserState {
  user: User | null;
}

const initialState: UserState = {
  user: null,
};
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

export const useAuth = () => {
    const user = useSelector((state: RootState) => state.user.user);
    return { user, isAuthenticated: !!user };
  };

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer; 