# React + TypeScript + Vite

🔹 Core Functionality Overview
1. File & Media Management

✅ Upload Files (Images, Videos, Documents, etc.)
✅ Store Metadata in MongoDB, Files in AWS S3
✅ Drag & Drop Uploading
✅ Bulk Upload Support
✅ File Type Auto-detection
✅ Set Tags & Descriptions on Upload
✅ Progress Bar for Large Uploads
2. File Browsing & Organization

✅ Grid & Table View Toggle
✅ Search & Filtering (By name, tags, uploader, file type, date)
✅ Sorting Options (By date, name, size)
✅ Folder-Based Organization (Like WordPress Media Library)
✅ Bulk Selection for Deleting/Moving Files
✅ File Thumbnails for Images/Videos
✅ Right-Side File Details Panel (On Selection)
3. File Actions

✅ Edit File Metadata (Rename, Change Tags, Description, Visibility)
✅ Delete Files (Soft Delete for Recovery)
✅ File Versioning (Keep Previous Versions Instead of Overwriting)
✅ Download & Preview Files
✅ Shareable Links for Public Files
✅ Restrict Access (Public/Private Toggle for Files)
🔹 User Management & Authentication
4. User Roles & Permissions

✅ Three User Roles:

    Admin (Full access, user management, logs)
    Manager (Upload/edit files but cannot delete others' files)
    User (Upload/view only their own files)
    ✅ Role-Based UI Adjustments (Admins see more options than Users)

5. User Authentication

✅ JWT-Based Authentication
✅ Login / Logout System
✅ Register New Users (Requires Name & Email)
✅ Password Hashing with Bcrypt
✅ Email Verification (Optional Future Feature)
✅ Two-Factor Authentication (Optional Future Feature)
6. User Profiles

✅ Randomly Generated Avatars by Default
✅ Option to Upload Custom Profile Picture
✅ Editable Name & Password
✅ Activity Log for Each User
🔹 Activity Tracking & Security
7. Action Logging & History

✅ Track Who Uploaded, Edited, Deleted Files
✅ Log Failed Login Attempts
✅ View Activity Feed in Admin Panel
✅ Download Logs as CSV (For Audit Reports)
8. Security Best Practices

✅ Authentication Middleware for Protected Routes
✅ Input Validation to Prevent Injection Attacks
✅ Role-Based Access Control (RBAC)
✅ Environment Variables for Sensitive Data
✅ Dependency Audits & Security Updates
🔹 UI & User Experience
9. Dashboard & Layout

✅ Sidebar Navigation (Dashboard, Uploads, Activity Logs, Profile)
✅ Top Bar with Global Search & Filters
✅ Floating "Add New" Button for File Uploads
✅ Right Panel for File Details When Selected
✅ Responsive Design for Desktop & Mobile
✅ Dark Mode Toggle (Optional Future Feature)
10. Notifications & Real-Time Updates

✅ In-App Toast Notifications for Actions (Upload Success, Errors, etc.)
✅ WebSocket-Based Real-Time Updates (Optional Future Feature)
✅ Email Notifications for Important Actions (Like File Deletion)
🔹 Technical Stack
11. Backend Stack

✅ Node.js & Express (Server & API)
✅ MongoDB (Mongoose) for Metadata Storage
✅ AWS S3 for File Storage
✅ Multer for File Upload Handling
✅ JWT for Authentication
✅ Winston for Logging
✅ Bcrypt for Password Hashing
12. Frontend Stack

✅ React (TypeScript) for UI
✅ Redux Toolkit for State Management
✅ React Router for Navigation
✅ MUI (Material UI) for UI Components
✅ Axios for API Requests

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```

# Omni Media App Frontend

This is the frontend for the Omni Media App. It's built with React, TypeScript, and Material UI.

## Deploying to Netlify

### Prerequisites

1. A Netlify account
2. Your backend API already deployed (or a plan for how to handle it)

### Setup Steps

1. **Prepare the Environment Variables**

   Update the `.env.production` file with your backend URL:

   ```
   VITE_BASE_URL=https://your-backend-url.com
   ```

2. **Deploy to Netlify**

   - Push your repository to GitHub, GitLab, or Bitbucket
   - Sign in to Netlify and click "New site from Git"
   - Connect your repository
   - Configure the build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Click "Deploy site"

3. **Configure Environment Variables in Netlify**

   - Go to Site settings > Build & deploy > Environment
   - Add your environment variables:
     - Key: `VITE_BASE_URL`
     - Value: Your backend URL

4. **Trigger a New Build**

   - Go to Deploys and click "Trigger deploy"

## Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env.local` file with your development settings
4. Start the development server: `npm run dev`

The app will be available at http://localhost:5173.

## Environment Variables

- `VITE_BASE_URL` - URL of the backend API

## Frontend Structure

- `/src/components` - Reusable React components
- `/src/pages` - Page components
- `/src/store` - Redux store configuration
- `/src/api` - API client and utilities
- `/src/interfaces` - TypeScript interfaces
- `/src/utils` - Utility functions
- `/src/config` - Configuration files
