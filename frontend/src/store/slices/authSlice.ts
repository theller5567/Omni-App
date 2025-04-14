import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

// Define the type for the authentication state
interface AuthState {
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  message: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  message: null,
};

// Types
interface UserRegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
}

interface UserLoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  refreshToken: string;
  user: any;
  message?: string;
}

// Async actions
export const register = createAsyncThunk(
  "auth/register",
  async (userData: UserRegistrationData, { rejectWithValue }) => {
    try {
      console.log("Sending registration data:", userData);
      
      // Use the simple-auth function for testing
      const registerUrl = '/.netlify/functions/simple-auth';
      console.log("Using register URL:", registerUrl);
      
      const response = await axios.post(registerUrl, userData);
      console.log("Registration response:", response.data);
      return response.data as AuthResponse;
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.message) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue("Registration failed");
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async (credentials: UserLoginCredentials, { rejectWithValue }) => {
    try {
      console.log("Logging in with:", credentials.email);
      
      // Use the simple-auth function for testing
      const loginUrl = '/.netlify/functions/simple-auth';
      console.log("Using login URL:", loginUrl);
      
      const response = await axios.post(loginUrl, credentials);
      
      // Type assertion for response data
      const authData = response.data as AuthResponse;
      
      // Store tokens in localStorage
      localStorage.setItem("authToken", authData.token);
      localStorage.setItem("refreshToken", authData.refreshToken);
      
      return authData;
    } catch (error: any) {
      console.error("Login error:", error.response?.data || error.message);
      if (error.response && error.response.data && error.response.data.message) {
        return rejectWithValue(error.response.data.message);
      }
      return rejectWithValue("Invalid credentials");
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.message = action.payload.message;
      })
      .addCase(register.rejected, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setUser, clearUser, setLoading, setError } = authSlice.actions;
export default authSlice.reducer;