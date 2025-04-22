import { configureStore } from "@reduxjs/toolkit";
import { enableMapSet } from "immer";
import authReducer from "./slices/authSlice";
import userReducer from './slices/userSlice';
import tagReducer from './slices/tagSlice';
import mediaTypeReducer from './slices/mediaTypeSlice';
import mediaReducer from './slices/mediaSlice';
import tagCategoryReducer from './slices/tagCategorySlice';

// Enable the MapSet plugin for Immer to handle Set and Map in the Redux state
enableMapSet();

const store = configureStore({
  reducer: {
    auth: authReducer,
    user: userReducer,
    tags: tagReducer,
    mediaTypes: mediaTypeReducer,
    media: mediaReducer,
    tagCategories: tagCategoryReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


export default store;
