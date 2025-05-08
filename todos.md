1. When deleting mediaFIles and then navigation to the mediaTYpe page the mediaTYpe page is not updated with the new list of mediaFIles. The mediaTYpe page is still showing the old list of media.

2. Create Tag categories/groups
    2A. Implement tag categories in all forms that require multiselect options or tags.

3. Run React Scan on application, checking for optimization and data bottlenecks
    3A. Make sure data is only fetched when needed and components only rendered when needed.
    3B. Reduce request calls and make more efficient

4. Make sure all pages are authorized by the correct User role permission - Who can do what?
    
5. Create a log for each user actions.

6. Add a review system where only a admin or superAdmin can approve new mediaFiles and Types.
    6A. Add a notification system using users email when they need to review a file or type.

7. Add More Tracking Points: Integrate with other controllers like mediaTypeController
Implement Retention Policy: Add functionality to clean up old logs
Add Dashboard Analytics: Create endpoints that provide aggregated statistics
Add Real-time Notifications: Use WebSockets to notify admins of important activities
Add Export Functionality: Allow downloading logs in CSV or Excel format

Check for Race conditions.

THink about using useQuery instead of useFetch.

Allow user to search mediaFiles with a mediaType of videoThumbnail when creating or updating a video thumbnail.

MediaTYpes
    when adding a new field, when the user forgets to click on the add button and hits next, give the user a message asking if they want to add the field.


Use inline Notifications instead of toast notifications. 
I am getting redundant messages and sometimes the user is unable to view the toast notification because 
it is behind the popup they are looking at.


Eventually remove the ability for users to create their own tags and only allow the user to use existing tags or existing tagCategories

New mediaFIles should not be visible to all users below admin roles if not yet approved by an admin. 
unapproved mediaFIles should show up in a component under the dashboard called nonApprovedMediaFiles.
An admin should be able to approve or disapprove a mediaFile as well as add a note on why the media 
file was disapproved that would be sent via email to the user who created the mediaFile



Creating a script to check for and manage orphaned files across your database and storage system is an excellent idea for the Omni-App. This would help maintain system integrity, optimize storage, and prevent potential issues that orphaned files might cause.
Here's how I would approach building this utility:
Orphaned Files Detection and Cleanup Script
Key Functionality
Find orphaned files in storage:
Scan your storage system (likely AWS S3 or similar)
Compare against media entries in MongoDB
Identify files that exist in storage but have no database record
Find orphaned references in database:
Identify database records pointing to non-existent files
Check for broken relationships (e.g., tags linked to deleted media)
Interactive confirmation:
Display orphaned items with metadata (size, upload date, etc.)
Provide preview capabilities where possible
Require explicit confirmation before deletion
Recovery options:
Create backup archives before deletion
Option to move files to a "quarantine" area instead of permanent deletion
Ability to restore from quarantine
Implementation Approach
I'd recommend creating a CLI utility with Node.js that can:
```javascript
Error calling tool 'edit_file'.
Let me sketch out a plan for this utility script:
.
This script would provide a solid foundation for orphaned file detection and management. I recommend enhancing it with these features:
Additional checks:
Look for temp files that might have been abandoned during uploads
Check thumbnails/derivatives that no longer have parent files
Verify integrity of related media connections
Performance considerations:
Implement pagination for large storage systems
Add progress indicators for long-running operations
Enable partial scans of specific directories/time periods
Safety features:
Create logs of all deletion actions for audit trail
Implement time-based quarantine (files deleted after X days)
Add verification steps (check file timestamps, sizes, etc.)
Scheduling options:
Make it runnable as a cron job with non-interactive mode
Add reporting to send results via email
Implement throttling to avoid API rate limits
Would you like me to develop a more detailed implementation of this script for your specific storage and database setup? I could create a complete utility with all these features that integrates with your existing codebase.




