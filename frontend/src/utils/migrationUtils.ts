/**
 * Migration Utils for tracking the transition from Redux to TanStack Query
 */

// Structure for tracking migration status
export interface MigrationStatus {
  slice: string;
  status: 'migrated' | 'partial' | 'pending';
  usageCount: number;
  missingFeatures?: string[];
  componentsUsingRedux?: string[];
}

// Get the migration status of different Redux slices
export const getMigrationStatus = (): MigrationStatus[] => {
  return [
    {
      slice: 'media',
      status: 'migrated',
      usageCount: 0, 
      missingFeatures: [],
      // Look in App.tsx, MediaLibraryPage.tsx, and other components
      componentsUsingRedux: ['App.tsx']
    },
    {
      slice: 'mediaTypes',
      status: 'partial',
      usageCount: 5,
      missingFeatures: ['Migration of MediaTypeDistribution component'],
      componentsUsingRedux: [
        'MediaTypeUploader/utils/*.ts', 
        'App.tsx', 
        'components/MediaTypeWarningDialog.tsx'
      ]
    },
    {
      slice: 'tagCategories',
      status: 'pending',
      usageCount: 8, 
      missingFeatures: [
        'API functions for tag categories',
        'TanStack Query hooks for tag operations',
        'Component migration'
      ],
      componentsUsingRedux: ['components/TagCategoryManager/*']
    },
    {
      slice: 'tags',
      status: 'pending',
      usageCount: 6,
      missingFeatures: [
        'API functions for tags',
        'TanStack Query hooks for tag operations',
        'Component migration'
      ],
      componentsUsingRedux: ['components/TagCategoryManager/*']
    },
    {
      slice: 'user',
      status: 'pending',
      usageCount: 12,
      missingFeatures: [
        'Authentication management',
        'User profile management',
        'User permissions'
      ],
      componentsUsingRedux: [
        'App.tsx',
        'components/Sidebar/Sidebar.tsx',
        'components/UserInvitation/*'
      ]
    },
    {
      slice: 'auth',
      status: 'pending',
      usageCount: 10,
      missingFeatures: [
        'Login/logout functionality',
        'Token management',
        'Permission checks'
      ],
      componentsUsingRedux: [
        'App.tsx',
        'components/ProtectedRoute.tsx',
        'pages/AuthPage.tsx'
      ]
    }
  ];
};

// Get next slice to migrate
export const getNextSliceToMigrate = (): MigrationStatus | null => {
  const statuses = getMigrationStatus();
  
  // Find the first slice with a 'partial' status
  const partialSlice = statuses.find(slice => slice.status === 'partial');
  if (partialSlice) return partialSlice;
  
  // If no partial slice, find the first pending slice
  return statuses.find(slice => slice.status === 'pending') || null;
};

// Get the overall migration progress
export const getMigrationProgress = (): { 
  percentage: number; 
  completed: number; 
  total: number;
  remainingSlices: string[]
} => {
  const statuses = getMigrationStatus();
  const total = statuses.length;
  const completed = statuses.filter(s => s.status === 'migrated').length;
  const partial = statuses.filter(s => s.status === 'partial').length;
  
  // Count partial migrations as half complete
  const percentage = Math.round(((completed + (partial * 0.5)) / total) * 100);
  
  const remainingSlices = statuses
    .filter(s => s.status !== 'migrated')
    .map(s => s.slice);
  
  return {
    percentage,
    completed,
    total,
    remainingSlices
  };
}; 