import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Async thunk for fetching files
export const fetchFiles = createAsyncThunk("files/fetchFiles", async (_, thunkAPI) => {
  try {
    const response = await axios.get("/api/files");
    return response.data;
  } catch (error: any) {
    if (error.response) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
    return thunkAPI.rejectWithValue("An unexpected error occurred.");
  }
});

// Async thunk for uploading a file
export const uploadFile = createAsyncThunk("files/uploadFile", async (fileData: Record<string, any>, thunkAPI) => {
  try {
    const formData = new FormData();
    Object.entries(fileData).forEach(([key, value]) => {
      formData.append(key, value);
    });
    const response = await axios.post("/api/files/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
    return thunkAPI.rejectWithValue("An unexpected error occurred.");
  }
});

// Async thunk for deleting a file
export const deleteFile = createAsyncThunk("files/deleteFile", async (fileId, thunkAPI) => {
  try {
    await axios.delete(`/api/files/${fileId}`);
    return fileId;
  } catch (error: any) {
    if (error.response) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
    return thunkAPI.rejectWithValue("An unexpected error occurred.");
  }
});

const fileSlice = createSlice({
  name: "files",
  initialState: {
    files: [] as any[],
    loading: false,
    error: null as any,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.files = action.payload as any;
      })
      .addCase(fetchFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as any;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.files.push(action.payload as any);
      })
      .addCase(deleteFile.fulfilled, (state, action) => {
        state.files = state.files.filter((file) => file._id !== action.payload);
      });
  },
});

export default fileSlice.reducer;
