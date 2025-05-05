# Video Thumbnail Selector Feature Documentation

## Overview

The Video Thumbnail Selector is a specialized feature for generating custom thumbnails from video files. It allows users to navigate to specific frames in a video and generate thumbnails that represent the content effectively.

## Key Components

### Frontend Components

#### 1. `ThumbnailUpdateDialog.tsx`
- Modal dialog wrapper that loads the thumbnail selector
- Entry point from the Media Detail page
- Passes media data to the thumbnail selector component

#### 2. `MediaDetailThumbnailSelector.tsx`
- Main component for thumbnail selection
- Features:
  - Video player with playback controls
  - Progress slider for timeline navigation
  - Frame-by-frame navigation buttons
  - Current time display
  - "Set Thumbnail" button
  - Before/after comparison view
  - Success indicators and animations
  - Thumbnail overlay preview

#### 3. `MediaDetail.tsx` Integration
- Adds the "Thumbnail" button for video files
- Handles the updated thumbnail data
- Updates Redux store and local state

### Backend Components

#### 1. `mediaRoutes.js` - API Endpoints
- `/update-thumbnail/:id` - For direct thumbnail uploads
- `/update/timestamp-thumbnail/:id` - For generating thumbnails at timestamps

#### 2. `videoService.js`
- Processes video files
- Extracts frames at specified timestamps
- Generates thumbnail images

#### 3. `awsService.js`
- Handles S3 upload and storage of thumbnails
- Manages deletion of old thumbnails

## Data Flow

1. **User Initiates Thumbnail Update**:
   - Opens Media Detail page for a video
   - Clicks "Thumbnail" button
   - ThumbnailUpdateDialog opens

2. **Frame Selection Process**:
   - User navigates to desired frame using video controls
   - Current timestamp is captured
   - "Set Thumbnail" button is clicked

3. **Backend Processing**:
   - Timestamp is sent to the server
   - Server extracts the frame from the video
   - Frame is converted to a JPEG thumbnail
   - Old thumbnail is deleted from S3
   - New thumbnail is uploaded to S3

4. **Database Update**:
   - MongoDB document is updated with:
     - New thumbnail URL in `metadata.v_thumbnail` field
     - Timestamp in `metadata.v_thumbnailTimestamp` field
     - Legacy `metadata.thumbnailUrl` field is removed

5. **UI Update**:
   - Updated media document is returned to the client
   - Redux store is updated with new data
   - UI displays the new thumbnail
   - Success animation is shown
   - Before/after comparison is displayed

## Caching and Refresh Strategy

To ensure thumbnails are properly updated and displayed throughout the application, several caching strategies are implemented:

### Cache-Busting Parameters

1. **Query Parameters**:
   - Timestamp-based query parameters are added to thumbnail URLs
   - Format: `?t={timestamp}&id={mediaId}`
   - This forces browsers to load fresh thumbnails

2. **Component Keys**:
   - Key props for React components include the thumbnail timestamp
   - This forces components to re-render when thumbnails change
   - Example: ``key={`${row.id}-${row.metadata?.v_thumbnailTimestamp || Date.now()}`}``

### MongoDB Direct Updates

To ensure reliable database updates:

1. **Direct MongoDB Commands**:
   - Uses MongoDB `updateOne()` instead of Mongoose methods
   - This bypasses potential Mongoose caching issues

2. **Field Standardization**:
   - Standardized on `v_thumbnail` field name
   - Uses `$unset` to remove legacy fields
   - Sets `v_thumbnailTimestamp` for cache validation

### Redux Store Updates

For consistent state across the application:

1. **Immediate Redux Dispatch**:
   - Updated media object is dispatched to Redux immediately
   - This ensures all components have access to fresh data

2. **Complete Object Updates**:
   - Full media object is updated, not just the thumbnail field
   - This prevents inconsistencies between different data sources

## Error Handling

1. **S3 Upload Errors**:
   - Catches and logs S3 upload failures
   - Shows user-friendly error messages

2. **Old Thumbnail Deletion**:
   - Handles failures to delete old thumbnails gracefully
   - Continues with process even if deletion fails

3. **UI Error States**:
   - Displays error messages to users
   - Provides retry options when appropriate

## Performance Considerations

1. **Virtualized Lists**:
   - DataTable uses virtualization to handle large media libraries
   - Only visible thumbnails are loaded

2. **Lazy Loading**:
   - Thumbnails use the `loading="lazy"` attribute
   - This defers loading off-screen thumbnails

3. **Memoization**:
   - Uses `useMemo` to prevent unnecessary URL recalculations
   - Prevents excessive re-renders

4. **Request Optimization**:
   - Proxies S3 requests through backend to reduce CORS issues
   - Prevents duplicate network requests

## Database Schema

The thumbnail information is stored in the Media document:

```javascript
{
  // Other media fields...
  metadata: {
    // Other metadata...
    v_thumbnail: String,         // S3 URL to the thumbnail
    v_thumbnailTimestamp: String // Timestamp when thumbnail was created
  }
}
```

## Implementation Notes

1. **Direct MongoDB Updates**
   - Previously, Mongoose updates weren't correctly saving the thumbnail field
   - Switched to direct MongoDB operations for reliability

2. **Component Re-rendering**
   - Added timestamp-based keys to force React to re-render components
   - This solved issues with UI not reflecting thumbnail changes

3. **Cache Busting**
   - Added dynamic query parameters to thumbnail URLs
   - This ensures browsers don't use cached versions of old thumbnails 