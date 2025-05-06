# Omni-App User Interface Guide

## Main Navigation

The application features a sidebar navigation menu that provides access to all major sections:

- **Media Library**: Browse and manage all media files
- **Upload Media**: Add new media files to the library
- **Media Types**: Manage custom media types and their fields
- **Tags**: Manage tag categories and tags
- **Dashboard**: View analytics and system information (admin only)
- **User Management**: Manage user accounts (admin only)

## Media Library

The Media Library is the central hub of the application, allowing users to browse, search, filter, and manage media files.

### View Modes

The Media Library offers two view modes:

1. **Card View**: A grid of visual cards showing thumbnails and basic information
2. **Table View**: A detailed table with customizable columns and advanced sorting

Toggle between these views using the view mode toggle in the header bar.

### Filtering and Searching

- **Media Type Filter**: Filter files by their media type (Video, Image, Document, etc.)
- **Search Bar**: Search by filename, description, tags, or custom metadata
- **Tag Filters**: Filter by applied tags

### Media Cards

Each media card displays:
- Thumbnail/preview image
- Filename
- Media type indicator
- Quick access actions

## Media Detail Page

The Media Detail page provides a comprehensive view of a single media file.

### Main Features

- **Preview Area**: Shows the media content (image, video player, PDF viewer, etc.)
- **Metadata Panel**: Displays all metadata fields
- **Action Buttons**: Edit, Download, and for videos, Thumbnail selection
- **Related Media**: View and manage related media files

### Related Media Tab

If a media file has related media attached, a tab interface allows switching between:
- The main media file
- Related media files

## Video Thumbnail Selector

For video files, a specialized thumbnail selector allows generating custom thumbnails.

### How to Access

1. Navigate to a video file's detail page
2. Click the "Thumbnail" button next to the Edit button

### Main Features

- **Video Player**: Preview the video with playback controls
- **Slider Timeline**: Navigate through the video timeline
- **Frame Controls**: Move frame-by-frame for precise selection
- **Set Thumbnail Button**: Generate a thumbnail at the current frame
- **Before/After Comparison**: View the previous thumbnail compared to the new one
- **Overlay Preview**: Shows the new thumbnail overlaid on the video player

### Steps to Create a Thumbnail

1. Navigate to the exact frame you want using the player controls
2. Click "Set Thumbnail" to generate the thumbnail
3. The system will:
   - Generate the thumbnail image from the current frame
   - Upload it to S3 storage
   - Update the media record in the database
   - Display a success indicator when complete

## Media Uploader

The Media Uploader allows adding new files to the library with appropriate metadata.

### Main Steps

1. **File Selection**: Drag and drop or select files to upload
2. **Media Type Selection**: Choose the appropriate media type
3. **Standard Metadata**: Add basic metadata (title, description, visibility, etc.)
4. **Custom Fields**: Fill in type-specific metadata fields 
5. **Related Media**: Optionally link to related media files
6. **Tags**: Apply appropriate tags for organization

## Media Type Management

Administrators can create and manage custom media types that define what metadata fields are available for different kinds of media.

### Media Type Structure

- **Name**: The type name (e.g., "Product Video", "Marketing Image")
- **Description**: Purpose and usage guidelines
- **Accepted File Types**: What file extensions are allowed
- **Category Color**: Visual indicator color in the UI
- **Default Tags**: Tags automatically applied to files of this type
- **Custom Fields**: Metadata fields specific to this type

### Field Types

Custom fields can be of different types:
- Text (single line)
- Text Area (multiple lines)
- Number
- Date
- Select (dropdown)
- Checkbox (true/false)
- Multi-select

## Tag Management

The tag system allows organizing and filtering media files.

### Tag Categories

Tags are organized into categories (e.g., "Department", "Campaign", "Product Line").

### Tag Application

Tags can be applied:
- During initial upload
- When editing a media file
- Automatically through default tags on media types

## Theme Toggle

The application supports both light and dark themes. Toggle between themes using the theme switch in the sidebar or header. 


SYSTEM SETTINGS
└── Notification Configuration
    ├── Email Recipients [Multi-select dropdown of admin users]
    ├── Notification Frequency [Immediate/Hourly/Daily dropdown]
    │
    ├── Notification Rules [Expandable sections]
    │   ├── Rule 1
    │   │   ├── Action Type: [Multi-select: UPLOAD, DELETE, etc.]
    │   │   ├── Resource Type: [Multi-select: media, user, etc.]
    │   │   ├── Triggered By: [Any user/Specific users/Specific roles]
    │   │   ├── Priority: [Normal/High selector]
    │   │   └── [Delete Rule] [Clone Rule]
    │   │
    │   ├── Rule 2...
    │   └── [+ Add New Rule]
    │
    ├── Test Configuration [Button that shows what would trigger]
    └── Save Settings [Button]