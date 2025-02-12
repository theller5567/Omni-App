# Omni-App

Omni-App is a powerful file management and media storage platform designed for efficient media upload, organization, and user management. It leverages modern technologies to provide an intuitive UI/UX, robust security, and seamless performance for managing images, videos, documents, and more.

## Core Features

### File & Media Management
- **File Uploading:** Supports drag & drop, bulk uploads, file type auto-detection, and metadata storage in MongoDB.
- **File Browsing & Organization:** Flexible file viewing (Grid & Table), powerful search & filter, and virtual folder-based organization.
- **File Actions:** Edit metadata, delete, versioning, download/preview, and generate shareable links.
- **File Metadata:** Store and manage metadata for images, PDFs, videos, and Word documents, with custom fields for each type.

### User Management & Authentication
- **Roles & Permissions:** Four roles: Admin, Manager, User, and Distributor with role-based UI adjustments.
- **Authentication:** JWT-based login, registration, password hashing, email verification, and optional two-factor authentication.
- **User Profiles:** Customizable avatars, profile details, and activity logs.

### Activity Tracking & Security
- **Action Logs:** Track file uploads, edits, deletions, and login attempts with exportable logs.
- **Security Best Practices:** Includes middleware for protected routes, input validation, role-based access control (RBAC), and dependency audits.

### UI & User Experience
- **Responsive Dashboard:** A fully responsive layout for desktop and mobile, with a top bar, file management options, and an easy-to-navigate sidebar.
- **Real-Time Updates:** In-app notifications for file actions and WebSocket support for real-time updates.
- **Bulk Actions & File Details Panel:** Manage files in bulk with action buttons and a dedicated panel for file details.

### Technical Stack
- **Backend:** Node.js, Express, MongoDB, AWS S3, JWT, Winston, Bcrypt, Multer.
- **Frontend:** React, TypeScript, Redux Toolkit, MUI (Material UI), Axios, Vite.
- **Security:** Authentication middleware, role-based access control, and input validation.

## File Metadata Example

Here’s how metadata is structured for different file types:

### Image Metadata
```json
{
  "_id": "65b9f0c3d5b8a3",
  "fileName": "sunset.jpg",
  "fileType": "image/jpeg",
  "folderPath": "/Nature/Landscapes",
  "tags": ["sunset", "nature", "landscape"],
  "uploadedBy": "user_123",
  "uploadDate": "2025-02-11T14:30:00Z",
  "s3Url": "https://s3.amazonaws.com/your-bucket/sunset.jpg",
  "visibility": "public",
  "size": 2048000,
  "width": 1920,
  "height": 1080,
  "description": "A beautiful sunset over the mountains.",
  "views": 15
}

### PDF Metadata
{
  "_id": "65b9f0c3d5b8a4",
  "fileName": "business_report.pdf",
  "fileType": "application/pdf",
  "folderPath": "/Documents/Reports",
  "tags": ["business", "report", "Q1"],
  "uploadedBy": "user_456",
  "uploadDate": "2025-02-11T15:00:00Z",
  "s3Url": "https://s3.amazonaws.com/your-bucket/business_report.pdf",
  "visibility": "private",
  "size": 5242880,
  "pageCount": 15,
  "author": "John Doe",
  "extractedText": "Quarterly business report for Q1 2025...",
  "description": "A comprehensive analysis of business performance in Q1 2025.",
  "views": 8
}

### Video Metadata
{
  "_id": "65b9f0c3d5b8a5",
  "fileName": "travel_vlog.mp4",
  "fileType": "video/mp4",
  "folderPath": "/Videos/Travel",
  "tags": ["travel", "vlog", "adventure"],
  "uploadedBy": "user_789",
  "uploadDate": "2025-02-11T16:00:00Z",
  "s3Url": "https://s3.amazonaws.com/your-bucket/travel_vlog.mp4",
  "visibility": "public",
  "size": 104857600,
  "duration": 300,
  "resolution": "1920x1080",
  "frameRate": 30,
  "bitrate": 5000000,
  "thumbnailUrl": "https://s3.amazonaws.com/your-bucket/thumbnails/travel_vlog.jpg",
  "description": "A travel vlog exploring the beautiful landscapes of Iceland.",
  "views": 22
}

Installation
Prerequisites

    Backend: Node.js, MongoDB, AWS S3 account.
    Frontend: Node.js, Vite.
    Optional: Email service for verification and notification features.

Setup Instructions

    Clone the repository:

git clone https://github.com/yourusername/omni-app.git

Install backend dependencies:

cd omni-app/backend
npm install

Set up environment variables:

    Create a .env file in the backend directory.
    Add necessary keys: MONGO_URI, S3_BUCKET, JWT_SECRET, etc.

Run the backend server:

npm start

Install frontend dependencies:

cd omni-app/frontend
npm install

Run the frontend app:

    npm run dev

Running Tests

Backend and frontend tests are handled using Jest. To run tests:

cd omni-app/backend
npm test

For frontend tests:

cd omni-app/frontend
npm test

Contributing

We welcome contributions! Here’s how you can help:

    Fork the repository.
    Create your feature branch (git checkout -b feature-name).
    Commit your changes (git commit -m 'Add new feature').
    Push to the branch (git push origin feature-name).
    Create a new Pull Request.

License

This project is licensed under the MIT License - see the LICENSE.md file for details.