import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Field {
  name: string;
  type: string;
  options?: string[];
  required: boolean;
}

interface MediaType {
  name: string;
  fields: Field[];
}

interface MediaTypeState {
  mediaTypes: MediaType[];
}

const initialState: MediaTypeState = {
  mediaTypes: [],
};

const mediaTypeSlice = createSlice({
  name: 'mediaTypes',
  initialState,
  reducers: {
    setMediaTypes: (state, action: PayloadAction<any[]>) => {
      state.mediaTypes = action.payload;
    },
    addMediaType: (state, action) => {
      state.mediaTypes.push(action.payload);
    }
  },
});

export const { setMediaTypes, addMediaType } = mediaTypeSlice.actions;
export default mediaTypeSlice.reducer;
