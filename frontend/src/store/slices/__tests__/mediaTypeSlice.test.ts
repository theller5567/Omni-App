import reducer, { 
  addMediaType, 
  setDeletionTarget, 
  resetOperation
} from '../mediaTypeSlice';

// Mock the env module
jest.mock('../../../config/env', () => ({
  BASE_URL: 'http://test-server.com'
}));

// Define the MediaTypeState interface for testing purposes
interface MediaTypeState {
  mediaTypes: any[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  currentOperation: 'none' | 'deprecating' | 'archiving' | 'migrating';
  deletionTarget: string | null;
  migrationSource: string | null;
  migrationTarget: string | null;
  affectedMediaCount: number;
}

// Sample test data
const initialTestState: MediaTypeState = {
  mediaTypes: [],
  status: 'idle',
  error: null,
  currentOperation: 'none',
  deletionTarget: null,
  migrationSource: null,
  migrationTarget: null,
  affectedMediaCount: 0
};

const sampleMediaType = {
  _id: '123456',
  name: 'Test Media Type',
  fields: [
    { name: 'title', type: 'Text', required: true }
  ],
  status: 'active' as 'active' | 'deprecated' | 'archived',
  usageCount: 0,
  replacedBy: null,
  isDeleting: false,
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01'
};

describe('mediaTypeSlice reducer', () => {
  test('should handle initial state', () => {
    // @ts-ignore - We're providing an undefined action for testing initial state
    expect(reducer(undefined, { type: undefined })).toEqual(expect.objectContaining({
      mediaTypes: [],
      status: 'idle',
      error: null
    }));
  });

  test('should handle addMediaType', () => {
    const newState = reducer(initialTestState, addMediaType(sampleMediaType));
    expect(newState.mediaTypes).toHaveLength(1);
    expect(newState.mediaTypes[0]).toEqual(sampleMediaType);
  });

  test('should handle setDeletionTarget', () => {
    const targetId = '123456';
    const newState = reducer(initialTestState, setDeletionTarget(targetId));
    
    expect(newState.deletionTarget).toEqual(targetId);
    expect(newState.currentOperation).toEqual('deprecating');
  });

  test('should handle resetOperation', () => {
    // Start with a modified state
    const modifiedState: MediaTypeState = {
      ...initialTestState,
      deletionTarget: '123456',
      currentOperation: 'deprecating',
      affectedMediaCount: 5
    };
    
    const newState = reducer(modifiedState, resetOperation());
    
    expect(newState.deletionTarget).toBeNull();
    expect(newState.currentOperation).toEqual('none');
    expect(newState.affectedMediaCount).toEqual(0);
  });
}); 