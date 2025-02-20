# Omni Media Library Project

## Overview

The Omni Media Library Project provides a modern, intuitive interface for managing, organizing, and sharing media files. This document outlines our latest features, UI updates, and technical details.

The main idea behind this project is to require specific data for each media type depending on how the media will be used.
This makes sure that there are restraints and guidelines for every media that is uploaded, allowing the user to come back to the library and find what they need at an extremely granular level. We will also be able to show n hide specific media depending on the Users permission Role.

This app will also have an approval process for new media, allowing the admin to approve or reject new media.
(this will prevent multiple variations of the same file from existing and clogging our systems and make sure that all outward facing media is approved and up to date.)



## Table of Contents

- [Core Functionality](#core-functionality)
- [User Management & Authentication](#user-management--authentication)
- [Activity Tracking & Security](#activity-tracking--security)
- [UI & User Experience Enhancements](#ui--user-experience-enhancements)
- [Technical Stack](#technical-stack)
- [File Metadata Examples](#file-metadata-examples)
- [Installation](#installation)
- [Running Tests](#running-tests)
- [Contributing](#contributing)
- [License](#license)

---

## Core Functionality

### 1. File & Media Management
- **Upload Files:** Supports images, videos, documents, and more.
- **Storage & Handling:**
  - Metadata is stored in MongoDB and files in AWS S3.
  - Drag & drop uploading with real-time file previews.
- **Bulk Upload:** Modern progress indicator for multiple files.
- **Auto-Detection:** Automatically recognizes file types.
- **Metadata Input:**
  - Set tags and descriptions during upload.
  - **New:** Includes an "altText" field for improved image accessibility.
- **Quick Preview:** Hover to preview file details before upload.

### 2. File Browsing & Organization
- **Default State**: 
  - Initially displays only the main root folders in a grid view.
  - Users can navigate through folders to access media files.

- **Folder Navigation**:
  - Clickable folders with breadcrumb navigation to track the current path.
  - Dynamic loading of folder contents as users navigate deeper.

- **File Count Display**:
  - Each folder shows the number of files it contains, providing quick insights into folder contents.

### 3. File Actions
- **Editing:** Rename files and update tags, descriptions, and visibility.
- **Deletion:** Soft deletion for easy recovery.
- **Versioning:** Retain previous file versions with rollback options.
- **Download & Preview:** Enhanced UI for file previews.
- **Sharing & Access Control:**
  - Generate secure, shareable links.
  - Toggle between public and private visibility.
- **Favorites:** **New:** Bookmark files for quick access.

### 4. Metadata Structure Enhancements
- **Image Metadata:** Now includes width, height, description, tags, `folderPath`, and `altText`.
- **PDF Metadata:** Stores page count, author, extracted text, and description.
- **Video Metadata:** Contains duration, resolution, frame rate, bitrate, thumbnail URL, captions, and description.
- **Word Document Metadata:** Includes page count, author, extracted text, and description.

---

## User Management & Authentication

### 5. User Roles & Permissions
- **Roles:**
  - **Admin:** Full access (user management, logs).
  - **Manager:** Can upload/edit files but cannot delete files uploaded by others.
  - **User:** Limited to uploading and viewing their own files.
  - **Distributor:** Focused on media distribution.
- **Role-Based UI:** Displays controls based on the user's role.

### 6. User Authentication
- **Security:** JWT-based authentication with Bcrypt password hashing.
- **Sessions:** Streamlined login/logout system.
- **Registration:** Requires name and email with enhanced verification.
- **Planned Enhancements:** Optional email verification and two-factor authentication.

### 7. User Profiles
- **Customization:**
  - Default avatars with an option for custom profile pictures.
  - **New:** Option to customize profile backgrounds/themes.
- **Editable Information:** Users can update their name and password.
- **Activity Log:** Tracks each user's actions.

---

## Activity Tracking & Security

### 8. Action Logging & History
- **Comprehensive Logging:** Records uploads, edits, deletions, and failed logins.
- **Admin Panel:** Filter and view an enhanced activity feed.
- **Export Logs:** Download logs as CSV for audits.

### 9. Security Best Practices
- **Access Control:** Uses middleware and RBAC to protect routes.
- **Input Validation:** Prevents injection attacks.
- **Sensitive Data:** Managed via environment variables.
- **Maintenance:** Regular dependency audits and security updates.

---

## UI & User Experience Enhancements

### 10. Dashboard & Layout
- **Sidebar Navigation:** Collapsible menus with clear icons.
- **Top Bar:** Updated search bar with autocomplete and notifications.
- **View Toggle:** Smooth switching between grid and table views.
- **File Details Panel:** Modern design with contextual actions.
- **Upload Modal:** Real-time progress bar and file preview.
- **Bulk Actions:** Streamlined multi-file operations.
- **Responsive Design:** Optimized for both desktop and mobile (hamburger menu on mobile).
- **Dark Mode:** Fully implemented with smooth transitions.

### 11. Notifications & Real-Time Updates
- **In-App Notifications:** Toast messages for actions (e.g., uploads, errors).
- **Notifications Center:** **New:** Top bar section for viewing past notifications.
- **Real-Time Updates:** WebSocket-based live updates and push notifications.

---

## Technical Stack

### 12. Backend Stack
- **Server & API:** Node.js and Express.
- **Database:** MongoDB (using Mongoose).
- **File Storage:** AWS S3.
- **File Uploads:** Handled by Multer.
- **Authentication:** JWT-based with Bcrypt.
- **Logging:** Managed with Winston.

### 13. Frontend Stack
- **Framework:** React (TypeScript).
- **State Management:** Redux Toolkit.
- **Routing:** React Router.
- **UI Library:** Material UI (MUI).
- **API Requests:** Axios.

---

## File Metadata Examples

### Image Metadata Example
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
      "altText": "Sunset over mountains",
      "description": "A beautiful sunset over the mountains.",
      "views": 15
    }

*Similar examples exist for PDF, Video, and Word Document metadata.*

---

## Installation

### Prerequisites
- **Backend:** Node.js, MongoDB, AWS S3 account.
- **Frontend:** Node.js, Vite.
- **Optional:** Email service for verification and notifications.

### Setup Instructions

1. **Clone the Repository:**
    git clone https://github.com/yourusername/omni-app.git

2. **Backend Setup:**
    cd omni-app/backend
    npm install

    - Create a `.env` file with keys such as `MONGO_URI`, `S3_BUCKET`, `JWT_SECRET`, etc.
    - Start the backend server:
      npm start

3. **Frontend Setup:**
    cd omni-app/frontend
    npm install
    npm run dev

---

## Running Tests

- **Backend Tests:**
    cd omni-app/backend
    npm test

- **Frontend Tests:**
    cd omni-app/frontend
    npm test

---

## Contributing

We welcome contributions! To contribute:

1. Fork the repository.
2. Create your feature branch:
    git checkout -b feature-name
3. Commit your changes:
    git commit -m "Add new feature"
4. Push the branch:
    git push origin feature-name
5. Open a Pull Request.

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.