# Omni Media Management Application (Omni-App)

## Overview
Omni-App is a comprehensive media management system designed to organize, store, and manage various types of media files. It supports multiple file types including images, videos, audio, PDFs, and documents, with custom metadata fields, tagging, and thumbnail generation.

## Project Structure

```
Omni-App/
├── frontend/                                  # React-based frontend application
│   ├── src/
│   │   ├── components/                        # UI components
│   │   │   ├── AdminDashboard/                # Admin analytics and management
│   │   │   ├── MediaDetail/                   # Media file details view
│   │   │   ├── MediaLibrary/                  # Media browsing and management
│   │   │   ├── MediaPicker/                   # Component for selecting media files
│   │   │   ├── MediaTypeUploader/             # Media type definition management
│   │   │   ├── MediaUploader/                 # File upload and metadata entry
│   │   │   ├── Sidebar/                       # Application navigation sidebar
│   │   │   ├── TagCategoryManager/            # Tag category and tag management 
│   │   │   ├── ThemeToggle/                   # Light/dark theme switching
│   │   │   └── VideoThumbnailSelector/        # Video thumbnail generation tool
│   │   ├── store/                             # Redux state management
│   │   │   └── slices/                        # Redux toolkit slices
│   │   ├── hooks/                             # Custom React hooks
│   │   ├── utils/                             # Utility functions
│   │   ├── styles/                            # Global styling
│   │   └── types/                             # TypeScript type definitions
│   └── public/                                # Static assets
│
├── backend/                                   # Node.js/Express backend server
│   ├── controllers/                           # Business logic handlers
│   ├── models/                                # MongoDB data models
│   │   └── baseSchemas/                       # Base schemas for media types
│   ├── routes/                                # API route definitions
│   ├── middleware/                            # Express middleware
│   ├── services/                              # Service layer (S3, video processing, etc.)
│   └── utils/                                 # Utility functions
│
└── shared_directory/                          # Shared resources between frontend and backend
```

## Key Features

### Media Management
- **Media Library**: Browse, search, and filter media files
- **Media Details**: View and edit media metadata, thumbnails, and related files
- **Media Uploader**: Upload files with custom metadata fields
- **Media Type System**: Define custom media types with specific metadata fields

### Video Features
- **Thumbnail Generation**: Select frames from videos to use as thumbnails
- **Video Playback**: Built-in video player for preview
- **Frame Navigation**: Frame-by-frame controls for precise thumbnail selection

### File Organization
- **Custom Metadata**: Define and use custom metadata fields for each media type
- **Tagging System**: Add and manage tags for easy file categorization
- **Related Media**: Link related media files together

### User Interface
- **Card and Table Views**: Toggle between visual card grid and detailed table views
- **Dark/Light Theme**: Toggle between dark and light interface themes
- **Responsive Design**: Mobile-friendly interface that adapts to various screen sizes

## Main Components

### Frontend

#### Media Library Components
- `MediaLibrary.tsx`: Main container for browsing and managing media
- `MediaCard.tsx`: Card view for media files
- `VirtualizedDataTable.tsx`: Table view with virtualization for performance

#### Media Detail Components
- `MediaDetail.tsx`: Detailed view of a single media file
- `MediaInformation.tsx`: Displays media metadata
- `EditMediaDialog.tsx`: Dialog for editing media metadata
- `ThumbnailUpdateDialog.tsx`: Dialog for updating video thumbnails

#### Video Components
- `MediaDetailThumbnailSelector.tsx`: Interface for selecting video thumbnails
- `ThumbnailSelectorTestPage.tsx`: Testing page for thumbnail functionality

#### Upload Components
- `MediaUploader.tsx`: File upload and metadata entry
- `MediaTypeUploader.tsx`: Create and edit media types

### Backend

#### Key Routes
- `mediaRoutes.js`: Endpoints for media file operations (CRUD)
- `mediaTypeRoutes.js`: Endpoints for media type operations
- `tagCategoryRoutes.js`: Endpoints for tag category operations
- `tagRoutes.js`: Endpoints for tag operations
- `authRoutes.js`: Authentication endpoints

#### Models
- `Media.js`: Core media file schema
- `MediaType.js`: Media type definitions
- `TagCategory.js`: Tag category schema
- `User.js`: User account schema
- `BaseVideo.js`, `BaseImage.js`, etc.: Base schemas for specific media types

#### Services
- `awsService.js`: S3 storage integration for file storage
- `videoService.js`: Video processing for thumbnail generation
- `activityTrackingService.js`: User activity logging

## Technology Stack

### Frontend
- **React**: UI library
- **TypeScript**: Type-safe JavaScript
- **Redux Toolkit**: State management
- **Material-UI**: UI component library
- **Framer Motion**: Animation library
- **Axios**: HTTP client

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose**: ODM for MongoDB
- **AWS SDK**: S3 integration
- **Multer**: File upload handling
- **JWT**: Authentication

### Storage
- **MongoDB Atlas**: Database hosting
- **AWS S3**: File storage

## Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, User roles)
- Protected routes for sensitive operations

## Media Processing
- **Image Processing**: Thumbnail generation for images
- **Video Processing**: Frame extraction for video thumbnails
- **S3 Integration**: File storage and retrieval with AWS S3

## Deployment
- Configured for Netlify deployment (frontend)
- Node.js server deployment for backend 