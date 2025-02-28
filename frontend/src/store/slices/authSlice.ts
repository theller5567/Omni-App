import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

// Define the type for the user
interface User {
  name: string;
  email: string;
  // Add any other fields you expect for the user
}

// Define the type for the response from the sign-up API
interface SignUpResponse {
    message: string;          // Success message returned from the backend
    verificationToken?: string;  // Include the verificationToken as part of the response
    user?: User;             // Optionally, include the user data in the response
}

// Define the type for the response from the sign-in API
interface SignInResponse {
  user: User; // Return user data after sign-in
}

// Define the type for user data that is passed into the API request
interface UserData {
  name: string;
  email: string;
}

// Define the type for the rejected error value (error message)
interface AsyncThunkConfig {
  rejectValue: string;  // This will be used to type the rejected error message
}

// AuthState with a more specific `user` type
interface AuthState {
  user: User | null;  // User data or null if not logged in
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  message: string | null;
}

// Async thunk for signing up a user
export const signUpUser = createAsyncThunk<SignUpResponse, UserData, AsyncThunkConfig>(
  "auth/signUpUser",
  async (userData, thunkAPI) => {
    try {
      const response = await axios.post<SignUpResponse>("http://localhost:5002/api/auth/signup", userData);
      return response.data;  // Return the successful response (message and user data)
    } catch (error: any) {
      if (error.response) {
        return thunkAPI.rejectWithValue(error.response.data); // Reject with error response
      }
      return thunkAPI.rejectWithValue("An unexpected error occurred.");
    }
  }
);

// Async thunk for signing in a user
export const signInUser = createAsyncThunk<SignInResponse, { username: string; password: string }, AsyncThunkConfig>(
  "auth/signInUser",
  async (userData, thunkAPI) => {
    try {
      const response = await axios.post<SignInResponse>("http://localhost:5002/api/auth/login", userData);
      return response.data; // This should include both token and user data
    } catch (error: any) {
      if (error.response) {
        return thunkAPI.rejectWithValue(error.response.data); // Reject with error response
      }
      return thunkAPI.rejectWithValue("An unexpected error occurred.");
    }
  }
);

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  message: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.message = null;  // Clear message on logout
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signUpUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signUpUser.fulfilled, (state, action: PayloadAction<SignUpResponse>) => {
        state.loading = false;
        state.message = action.payload.message;  // Set success message in state
        state.user = action.payload.user || null;  // Store user data from backend
        state.isAuthenticated = false;  // Wait for email verification
      })
      .addCase(signUpUser.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.loading = false;
        state.error = action.payload || "An unknown error occurred."; // Handle undefined payload
      })
      .addCase(signInUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signInUser.fulfilled, (state, action: PayloadAction<SignInResponse>) => {
        state.loading = false;
        state.user = action.payload.user;  // Set user data after successful login
        state.isAuthenticated = true;
      })
      .addCase(signInUser.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.loading = false;
        state.error = action.payload || "An unknown error occurred."; // Handle undefined payload
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;