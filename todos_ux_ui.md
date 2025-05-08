# Omni-App UX/UI Improvements

## Bug Fixes
1. **Media Type Page Update Issue**
   - When deleting mediaFiles, the MediaType page doesn't refresh with updated list

## Feature Enhancements

### Tag Management
1. **Create Tag Categories/Groups**
   - Implement tag categories in all forms requiring multiselect options or tags
   - Eventually restrict users to only use existing tags or tag categories

### Performance Optimization
1. **Application Performance Audit**
   - Run React scan checking for optimization and data bottlenecks
   - Ensure data is fetched only when needed
   - Reduce and optimize API requests
   - Consider migrating from useFetch to useQuery
   - Check for race conditions

### User Permissions & Security
1. **Role-Based Authorization**
   - Ensure all pages are properly authorized by correct user role permissions
   - Define clear "who can do what" permissions matrix

### Tracking & Monitoring
1. **User Activity Logging**
   - Create comprehensive logs for user actions
   - Add tracking points in controllers (mediaTypeController, etc.)
   - Implement retention policy for old logs
   - Create dashboard analytics with aggregated statistics
   - Add export functionality (CSV/Excel)

### Content Approval System
1. **Admin Review System**
   - Only admin/superAdmin can approve new mediaFiles and Types
   - Add email notification system for review requests
   - Hide unapproved mediaFiles from non-admin users
   - Display unapproved files in "nonApprovedMediaFiles" dashboard component
   - Allow admins to approve/disapprove with feedback notes

### UI Improvements
1. **Notification System**
   - Replace toast notifications with inline notifications
   - Fix redundant messages and visibility issues with popups
   
2. **Form Improvements**
   - Add confirmation when user forgets to click "add" button for new fields
   - Improve search functionality for videoThumbnail mediaType selection

## Orphaned Files Management Utility

### Key Functionality
- **Storage Scanning**
  - Scan AWS S3 or similar storage
  - Compare against MongoDB media entries
  - Identify orphaned files

- **Database Reference Checking**
  - Find records pointing to non-existent files
  - Check broken relationships (tags linked to deleted media)

- **User Interface**
  - Display orphaned items with metadata
  - Provide preview capabilities
  - Require confirmation before deletion

- **Recovery Options**
  - Create backup archives
  - Quarantine option instead of permanent deletion
  - Restoration capability

### Implementation Enhancements
- **Additional Checks**
  - Temp file detection
  - Thumbnail/derivative orphan detection
  - Media connection integrity verification

- **Performance Features**
  - Pagination for large storage systems
  - Progress indicators
  - Partial scan capabilities

- **Safety Measures**
  - Deletion audit logs
  - Time-based quarantine
  - File verification steps

- **Automation**
  - Cron job compatibility
  - Email reporting
  - API rate limit handling

## User Invitation System

### Invitation Flow
- **Entry Point**
  - "Invite User" button with '+' icon in AccountUsers page

- **Invitation Modal**
  - Essential fields: First/Last Name, Email, Role
  - Email validation
  - Welcome email option
  - Email preview

- **Feedback**
  - Success messages
  - Visual indicators for pending invitations
  - Resend capability

### User Experience
- **Email Design**
  - Professional appearance
  - Clear sender identification
  - Expectations and expiration date

- **Registration Process**
  - Pre-filled information
  - Focus on password creation
  - Name editing option

- **Management**
  - Invitations tab/filter
  - Expiration tracking
  - Revocation capabilities

- **Special Features**
  - Personalized messages
  - Onboarding guidance
  - Secure tokens and rate limiting
  - Admin notifications
