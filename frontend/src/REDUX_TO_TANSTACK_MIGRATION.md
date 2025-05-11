# Redux to TanStack Query Migration

## Overview
This document outlines the ongoing migration from Redux to TanStack Query for state management in the Omni-App. The migration aims to improve application performance, reduce boilerplate code, and provide better data synchronization.

## Completed Steps

### 1. Enhanced Query Hooks
- Added proper query key management with hierarchical keys
- Implemented optimistic updates for mutations
- Created `useTransformedMedia` hook for consistent data formatting
- Added prefetching for common navigation paths

### 2. MediaLibraryPage Refactoring
- Replaced Redux state with TanStack Query hooks
- Implemented optimistic UI updates for media operations
- Improved error handling with toast notifications
- Enhanced search functionality with broader text matching

### 3. App Initialization Improvements
- Modified App.tsx to use TanStack Query instead of Redux for media state
- Improved QueryClient configuration with better caching and retry policies
- Removed redundant Redux initialization code

### 4. Media Types Migration (Completed)
- Added comprehensive TanStack Query hooks for media types
- Added migration functionality between media types
- Updated AccountAdminDashboard to use TanStack Query for media type data
- Updated MediaTypeDistribution component to use TanStack Query instead of Redux
- Fixed runtime error in EditMediaDialog by updating MediaDetail component to use TanStack Query for media types
- Updated MediaTypeUploader component to use TanStack Query for media type operations
- Created utility to track migration progress
- Updated DataTable and VirtualizedDataTable components in MediaLibrary to use TanStack Query for media types
- Updated MediaLibrary component to use TanStack Query for tag categories

### 5. Tags and Tag Categories Migration (Completed)
- Implemented comprehensive API functions for tags and tag categories
- Created TanStack Query hooks for tag and tag category operations
- Added proper caching and cache invalidation for tags and categories
- Updated TagCategoryManager component to use TanStack Query instead of Redux
- Updated TagCategoryForm component to use TanStack Query for tag operations
- Updated AccountTags page to use TanStack Query for both tag and tag category operations

## Benefits

### Performance Improvements
- **Reduced Network Requests**: Automatic request deduplication prevents redundant API calls
- **Optimistic Updates**: UI updates immediately before server confirmation, improving perceived speed
- **Efficient Caching**: Stale-while-revalidate pattern keeps UI responsive while refreshing data
- **Data Transformations**: Consistent data formatting at the query level reduces component workload

### Developer Experience
- **Simpler Code**: Less boilerplate compared to Redux actions/reducers/thunks
- **Automatic Loading & Error States**: Built-in loading and error handling
- **Easier Debugging**: React Query DevTools provide visibility into cache and request status
- **TypeScript Integration**: Better type safety with TypeScript generics

## Next Steps

### 1. Continue Migration for Media Types
- ✅ Add migration functionality
- ✅ Update AccountAdminDashboard component
- ✅ Update MediaTypeDistribution component
- ✅ Update MediaDetail components
- ✅ Update MediaTypeUploader component
- ✅ Update DataTable component in MediaLibrary
- ⬜ Complete final cleanup and remove Redux mediaTypes slice

### 2. Migrate Tag Categories
- ✅ Implement API functions for tag categories
- ✅ Create TanStack Query hooks for tag category operations
- ✅ Migrate TagCategoryManager components

### 3. Migrate Tags
- ✅ Implement API functions for tags
- ✅ Create TanStack Query hooks for tag operations
- ✅ Update TagCategoryForm component
- ✅ Update AccountTags page to use TanStack Query

### 4. Authentication and User Management (Final Phase)
- ⬜ Create authentication hooks with TanStack Query
- ⬜ Implement user profile management
- ⬜ Update permission checks
- ⬜ Replace auth slice

### 5. Redux Store Cleanup
- ⬜ Remove redundant Redux slices as they're replaced by Query hooks
- ⬜ Keep authentication state in Redux until the final phase

### 6. Performance Tuning
- ⬜ Fine-tune caching strategies based on data freshness requirements
- ⬜ Implement background fetching for improved UX
- ⬜ Add proper query invalidation across related resources

## Migration Progress
- Media slice: ✅ 100% complete
- Media Types slice: ✅ 100% complete
- Tag Categories slice: ✅ 100% complete
- Tags slice: ✅ 100% complete
- User slice: ⬜ 0% complete
- Auth slice: ⬜ 0% complete

## Migration Best Practices

1. **Incremental Approach**: Migrate one feature at a time while maintaining compatibility
2. **Parallel Systems**: Allow Redux and Query to coexist during migration
3. **Test Thoroughly**: Verify each migrated feature works correctly before proceeding
4. **Monitor Performance**: Use React DevTools and browser tools to verify improvements

## Resources
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Migration Guide from Redux to React Query](https://tkdodo.eu/blog/redux-to-react-query)
- [React Query Patterns](https://tkdodo.eu/blog/react-query-patterns) 