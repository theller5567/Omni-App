Each task should have its own unit test. before moving to the next task the unit test must pass and i have to approve.


Phase 1: Frontend Component Setup
Create basic MediaDetailThumbnailSelector component
Create minimal skeleton component with video player and controls
Add basic styling to match existing UI
Test that video loads and plays correctly
Implement video controls and timestamp selection
Add play/pause functionality
Implement timeline slider for navigation
Create timestamp capture mechanism
Add UI for displaying current timestamp
Phase 2: Backend Setup for Video Access
Create video proxy endpoint
Implement backend route to serve S3 videos from same origin
Test that videos can be loaded without CORS issues
Ensure seeking and other video operations work correctly
Phase 3: Thumbnail Generation API
Create timestamp thumbnail endpoint
Implement endpoint to accept mediaId and timestamp
Use existing generateVideoThumbnail function
Return success/failure message only (for initial testing)
Verify backend receives correct timestamp data
Implement S3 storage for thumbnails
Add thumbnail creation code with mediaFile ID in filename
Test S3 upload functionality works correctly
Ensure proper error handling
Add metadata updating functionality
Implement code to update mediaFile metadata with new thumbnail URL
Add old thumbnail removal from S3
Test complete flow from timestamp to database update
Phase 4: Frontend-Backend Integration
Connect frontend to thumbnail API
Add API call from MediaDetailThumbnailSelector to backend
Implement proper state handling for loading/success/error
Test that backend receives correct parameters
Handle thumbnail updates in UI
Display updated thumbnail after generation
Add cache-busting for thumbnail URLs
Ensure UI updates correctly when thumbnail changes
Phase 5: Integration with EditMediaDialog
Integrate the thumbnail selector into existing UI
Add the component to EditMediaDialog
Handle component mounting/unmounting properly
Ensure proper props are passed
Test end-to-end functionality
Verify complete flow from UI to backend and back
Test with different video formats and sizes
Ensure clean error handling for users
Phase 6: Optimization and Polish
Performance optimization
Add loading indicators
Optimize video loading and seeking
Add debouncing for rapid timestamp changes
UX improvements
Add confirmation before replacing existing thumbnail
Implement undo functionality if possible
Polish visual feedback during thumbnail generation