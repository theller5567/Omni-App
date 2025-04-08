import reducer, { 
  addMedia, 
  updateMedia, 
  deleteMedia, 
  initializeMedia 
} from '../mediaSlice';
import { configureStore } from '@reduxjs/toolkit';
import { BaseMediaFile } from '../../../interfaces/MediaFile';

// Mock the env module
jest.mock('../../../config/env', () => ({
  BASE_URL: 'http://test-server.com'
}));

// Mock the axios module
jest.mock('axios', () => ({
  get: jest.fn()
}));

// Define the MediaState interface for testing purposes
interface MediaState {
  allMedia: BaseMediaFile[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

// Sample test data
const initialTestState: MediaState = {
  allMedia: [],
  status: 'idle',
  error: null
};

const sampleMediaFile: BaseMediaFile = {
  _id: '123456',
  id: '123456',
  title: 'Test Image',
  location: 'https://example.com/test.jpg',
  slug: 'test-image',
  fileSize: 1024,
  fileExtension: 'jpg',
  modifiedDate: '2023-01-01T00:00:00.000Z',
  uploadedBy: 'user1',
  modifiedBy: 'user1',
  mediaType: 'ProductImage',
  metadata: {
    fileName: 'test.jpg',
    tags: ['test', 'image'],
    visibility: 'public',
    altText: 'Test image',
    description: 'This is a test image'
  }
};

describe('mediaSlice reducer', () => {
  test('should handle initial state', () => {
    // @ts-ignore - We're providing an undefined action for testing initial state
    expect(reducer(undefined, { type: undefined })).toEqual(expect.objectContaining({
      allMedia: [],
      status: 'idle',
      error: null
    }));
  });

  test('should handle addMedia', () => {
    const newState = reducer(initialTestState, addMedia(sampleMediaFile));
    expect(newState.allMedia).toHaveLength(1);
    expect(newState.allMedia[0]).toEqual(sampleMediaFile);
  });

  test('should handle updateMedia', () => {
    // Start with a state that has the media file
    const startState: MediaState = {
      ...initialTestState,
      allMedia: [sampleMediaFile]
    };
    
    // Update with modified data
    const updatedMediaFile: BaseMediaFile = {
      ...sampleMediaFile,
      title: 'Updated Test Image',
      metadata: {
        ...sampleMediaFile.metadata,
        description: 'This is an updated test image'
      }
    };
    
    const newState = reducer(startState, updateMedia(updatedMediaFile));
    
    expect(newState.allMedia).toHaveLength(1);
    expect(newState.allMedia[0].title).toEqual('Updated Test Image');
    expect(newState.allMedia[0].metadata?.description).toEqual('This is an updated test image');
  });

  test('should handle deleteMedia', () => {
    // Start with a state that has the media file
    const startState: MediaState = {
      ...initialTestState,
      allMedia: [sampleMediaFile]
    };
    
    const newState = reducer(startState, deleteMedia(sampleMediaFile._id as string));
    
    expect(newState.allMedia).toHaveLength(0);
  });

  test('should handle initializeMedia.pending', () => {
    // Create a mock store to test async actions
    const store = configureStore({
      reducer: { media: reducer }
    });
    
    // Dispatch the pending action
    store.dispatch({ type: initializeMedia.pending.type });
    
    // Check if state was updated correctly
    expect(store.getState().media.status).toEqual('loading');
  });

  test('should handle initializeMedia.fulfilled', () => {
    const mockMediaFiles: BaseMediaFile[] = [sampleMediaFile];
    
    const newState = reducer(
      initialTestState,
      {
        type: initializeMedia.fulfilled.type,
        payload: mockMediaFiles
      }
    );
    
    expect(newState.status).toEqual('succeeded');
    expect(newState.allMedia).toHaveLength(1);
    expect(newState.allMedia[0].title).toEqual('Test Image');
  });

  test('should handle initializeMedia.rejected', () => {
    const errorMessage = 'Failed to fetch media';
    
    const newState = reducer(
      initialTestState,
      {
        type: initializeMedia.rejected.type,
        payload: errorMessage
      }
    );
    
    expect(newState.status).toEqual('failed');
    expect(newState.error).toEqual(errorMessage);
  });
}); 