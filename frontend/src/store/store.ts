import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import fileReducer from "./slices/fileSlice";
import userReducer from './slices/userSlice';
import tagReducer from './slices/tagSlice';
import mediaTypeReducer from './slices/mediaTypeSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    file: fileReducer,
    user: userReducer,
    tags: tagReducer,
    mediaTypes: mediaTypeReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


export default store;
