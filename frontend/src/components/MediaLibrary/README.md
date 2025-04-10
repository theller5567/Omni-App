# Media Library Module

This module contains components for the media library functionality.

## Structure

```
MediaLibrary/
├── components/                   # Reusable components
│   ├── ConfirmationModal.tsx     # Modal for confirming actions like deletion
│   ├── DataTable.tsx             # Data grid component for displaying media files in list view
│   ├── HeaderComponent.tsx       # Header with search, filters, and view toggle
│   ├── MediaCard.tsx             # Card component for grid view of media files
│   └── index.ts                  # Exports all components
├── styles/                       # Stylesheet files
│   ├── HeaderComponent.scss      # Styles for HeaderComponent
│   ├── MediaCard.scss            # Styles for MediaCard
│   ├── MediaLibrary.scss         # Main styles for MediaLibrary
│   └── index.ts                  # Exports all styles
├── utils/                        # Utility functions
│   ├── fileUtils.ts              # Functions for file type detection and handling
│   ├── iconUtils.ts              # Functions for rendering appropriate file icons
│   └── index.ts                  # Exports all utilities
├── MediaLibrary.tsx              # Main component that combines all others
└── README.md                     # This documentation file
```

## Components

### MediaLibrary

The main container component that orchestrates the media library user interface. It handles:
- Switching between list and grid views
- Media type filtering
- Selection and deletion of media files

### DataTable

A reusable component that displays media files in a responsive data grid with:
- Sortable columns
- Search functionality
- File previews with proper responsive sizing
- Action buttons for each row

### HeaderComponent

Provides the header UI for the media library with:
- Search input
- Media type filter buttons
- View mode toggle (list/grid)
- Add media button

### MediaCard

Card component used in the grid view to display:
- File preview (images, video thumbnails, or file type icons)
- File name and other metadata
- Click handler for opening file details

### ConfirmationModal

A generic confirmation dialog used for destructive actions like deleting files.

## Utilities

### File Utilities

The `fileUtils.ts` module provides helper functions for working with files:

- `isImageFile(extension)`: Determines if a file is an image based on its extension
- `isVideoFile(extension)`: Determines if a file is a video based on its extension  
- `isAudioFile(extension)`: Determines if a file is an audio file based on its extension
- `isDocumentFile(extension)`: Determines if a file is a document based on its extension
- `getMimeType(extension)`: Returns the MIME type for a given file extension

### Icon Utilities

The `iconUtils.ts` module contains functions for rendering file type icons:

- `getFileIcon(fileExtension, mediaType, size)`: Returns the appropriate React icon component for a file based on its extension and media type

## Usage

To use the MediaLibrary in a page component:

```jsx
import MediaLibrary from '../components/MediaLibrary/MediaLibrary';

const MediaLibraryPage = () => {
  // Add state and handlers here
  
  return (
    <MediaLibrary
      mediaFilesData={mediaFiles}
      setSearchQuery={setSearchQuery}
      onAddMedia={handleAddMedia}
      onDeleteMedia={handleDeleteMedia}
    />
  );
};
``` 