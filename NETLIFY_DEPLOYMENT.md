# Deploying Your App to Netlify

This guide will walk you through deploying your Omni App to Netlify.

## Prerequisites

- A GitHub repository with your project
- A Netlify account (free tier is fine)
- Your backend API deployed and accessible (if applicable)

## Setup Steps

### 1. Install Netlify CLI (Optional, but recommended)

If you want to test your deployment locally before pushing to production:

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to your Netlify account
netlify login
```

### 2. Update Environment Variables

Edit the `.env.production` file in the `frontend` directory:

```
VITE_BASE_URL=https://your-backend-api-url.com
```

Replace `https://your-backend-api-url.com` with the actual URL of your deployed backend API.

### 3. Test Your Build Locally

```bash
# Navigate to frontend directory
cd frontend

# Build your project
npm run build

# Preview the build
npm run preview
```

This will show you how your app will appear when deployed. Make sure everything works as expected.

### 4. Deploy to Netlify

#### Option 1: Deploy via Netlify Dashboard (Easiest)

1. Go to [Netlify](https://app.netlify.com/) and login
2. Click "Add new site" > "Import an existing project"
3. Connect to your GitHub repository
4. Configure the build settings:
   - Build command: `cd frontend && npm run build`
   - Publish directory: `frontend/dist`
5. Add your environment variables under "Site settings" > "Environment variables":
   - Add `VITE_BASE_URL` with your backend URL
6. Click "Deploy site"

#### Option 2: Deploy via Netlify CLI

```bash
# Run from the project root directory
netlify deploy
```

Follow the prompts and select:
- Create & configure a new site
- Choose your team
- Enter a site name (or accept the default)
- When asked for the publish directory, enter: `frontend/dist`

This will deploy a preview version. To deploy to production:

```bash
netlify deploy --prod
```

### 5. Set Up Redirects for SPA Routing

Netlify needs to know to serve `index.html` for all routes in a single-page application. We've added this configuration in two places:

1. The `_redirects` file in `frontend/public`
2. The `netlify.toml` file in the root directory

These ensure that when users navigate directly to a route like `/account`, they still get the correct page instead of a 404 error.

### 6. Configure Custom Domain (Optional)

1. Go to your site dashboard in Netlify
2. Navigate to "Domain settings"
3. Click "Add custom domain"
4. Follow the instructions to set up your domain with DNS records

### 7. Set Up Continuous Deployment

Netlify automatically sets up continuous deployment from your GitHub repo. Every time you push to your main branch, Netlify will rebuild and deploy your site.

To customize this behavior:
1. Go to your site dashboard in Netlify
2. Navigate to "Build & deploy" > "Continuous deployment"
3. Configure branch deploys, build hooks, etc.

## Troubleshooting

### Issue: API Calls Not Working

Make sure your backend API:
- Has CORS properly configured to allow requests from your Netlify domain
- Is publicly accessible or has proper authentication
- Check your environment variable `VITE_BASE_URL` is correctly set

### Issue: Routing Not Working

If you navigate directly to a page like `/account` and get a 404:
- Make sure the `_redirects` file is in your `frontend/public` directory
- Check that the `netlify.toml` file is in your root directory
- Verify that both files have the proper redirect rules

### Issue: Build Failures

If your build fails on Netlify:
- Check the build logs in the Netlify dashboard
- Make sure all dependencies are properly listed in your `package.json`
- Verify that your build command works locally

## Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Deploying a Vite App](https://vitejs.dev/guide/static-deploy.html#netlify)
- [Netlify Redirects and Rewrites](https://docs.netlify.com/routing/redirects/) 