import express from 'express';
import multer from 'multer';
import MediaType from '../models/MediaType.js';
import Media from '../models/Media.js';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { pipeline } from 'stream/promises';
import archiver from 'archiver';
import { fileURLToPath } from 'url';
import { authenticate } from '../middleware/authMiddleware.js';
import ActivityTrackingService from '../services/activityTrackingService.js';
import { uploadFileToS3, deleteFileFromS3 } from '../services/awsService.js';
import { 
  getAllMedia, 
  getMediaById, 
  updateMedia, 
  deleteMedia, 
  uploadMedia,
  searchMedia,
  debugMediaFile,
  approveMediaItem,
  rejectMediaItem,
  getPendingMediaReviews,
  getRejectedMedia,
  getMediaByUserId,
  getMediaByTypeName
} from '../controllers/mediaController.js';
import mongoose from 'mongoose';
import LoggerService from '../services/loggerService.js';
import { semanticSearch } from '../services/searchService.js';

const router = express.Router();

// Configure multer to handle multiple fields
const upload = multer();
const uploadFields = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'v_thumbnail', maxCount: 1 }
]);

router.put('/update/:slug', authenticate, updateMedia);

router.get('/all', getAllMedia);

router.get('/media-types', async (req, res) => {
  try {
    const mediaTypes = await MediaType.find().lean();
    console.log('Found media types:', mediaTypes);
    res.status(200).json(mediaTypes);
  } catch (error) {
    console.error('Error fetching media types:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Middleware to validate file type against media type's accepted types
const validateFileType = async (req, res, next) => {
  try {
    if (!req.files || !req.files.file || !req.files.file[0]) {
      console.error('No file in validateFileType middleware');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.files.file[0];
    const { mediaType: mediaTypeName } = req.body;
    
    console.log('Validating file:', {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      mediaType: mediaTypeName
    });

    if (!mediaTypeName) {
      return res.status(400).json({ error: 'Media type is required' });
    }

    // Fetch the media type to check accepted file types
    const mediaType = await MediaType.findOne({ name: mediaTypeName });
    if (!mediaType) {
      return res.status(400).json({ error: `Media type '${mediaTypeName}' not found` });
    }

    // If no acceptedFileTypes are defined, proceed (backward compatibility)
    if (!mediaType.acceptedFileTypes || mediaType.acceptedFileTypes.length === 0) {
      console.log(`No file type restrictions for media type: ${mediaTypeName}`);
      return next();
    }

    // Get the uploaded file's MIME type
    const fileMimeType = file.mimetype;
    console.log(`Validating file type: ${fileMimeType} for media type: ${mediaTypeName}`);

    // Check if the file type is allowed
    const isExactMatch = mediaType.acceptedFileTypes.includes(fileMimeType);
    
    // Check for wildcard match (e.g., "image/*" should match "image/png")
    const fileCategory = fileMimeType.split('/')[0];
    const isWildcardMatch = mediaType.acceptedFileTypes.includes(`${fileCategory}/*`);

    if (!isExactMatch && !isWildcardMatch) {
      console.error(`Invalid file type: ${fileMimeType}. Accepted types: ${mediaType.acceptedFileTypes.join(', ')}`);
      return res.status(400).json({ 
        error: `Invalid file type. This media type only accepts: ${mediaType.acceptedFileTypes.join(', ')}` 
      });
    }

    // File type is valid, proceed
    console.log(`File type validation passed for media type: ${mediaTypeName}`);
    next();
  } catch (error) {
    console.error('Error in file type validation:', error);
    res.status(500).json({ error: 'Internal server error during file validation' });
  }
};

router.post('/upload', authenticate, uploadFields, async (req, res, next) => {
  console.log('Received upload request');
  console.log('Files:', req.files);
  console.log('Body:', {
    mediaType: req.body.mediaType,
    mediaTypeId: req.body.mediaTypeId,
    metadata: req.body.metadata,
    title: req.body.title
  });
  
  // Check if files were received
  if (!req.files || !req.files.file || !req.files.file[0]) {
    console.error('No file received in request');
    console.error('req.files:', req.files);
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const mediaTypeName = req.body.mediaType;
    const mediaTypeId = req.body.mediaTypeId;
    console.log('Received media type:', { mediaTypeName, mediaTypeId });
    
    // Fetch media types using the MediaType model
    const mediaTypes = await MediaType.find();
    console.log('Available media types:', mediaTypes.map(t => t.name));
    
    let selectedType = null;
    if (mediaTypeId) {
      selectedType = await MediaType.findById(mediaTypeId).lean();
      if (!selectedType) {
        console.error(`Invalid media type id: ${mediaTypeId}`);
        return res.status(400).json({ error: `Invalid media type id: ${mediaTypeId}` });
      }
    } else if (mediaTypeName) {
      selectedType = await MediaType.findOne({ name: mediaTypeName }).lean();
      if (!selectedType) {
        console.error(`Invalid media type: ${mediaTypeName}`);
        return res.status(400).json({ error: `Invalid media type: ${mediaTypeName}` });
      }
    } else {
      return res.status(400).json({ error: 'mediaTypeId or mediaType (name) is required' });
    }

    next();
  } catch (error) {
    console.error('Error in media type validation:', error);
    res.status(500).json({ error: 'Internal server error during media type validation' });
  }
}, validateFileType, uploadMedia);

router.delete('/delete/:id', authenticate, deleteMedia);

// Get all media
router.get('/', getAllMedia);

// Search media (must come before ID routes)
router.get('/search/:query', searchMedia);
router.get('/semantic-search', async (req, res) => {
  try {
    const q = (req.query.q || '').toString();
    const limit = Math.min(parseInt((req.query.limit || '20').toString(), 10) || 20, 50);
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Query parameter q is required and must be >= 2 chars' });
    }
    const results = await semanticSearch(q, limit);
    return res.status(200).json(results);
  } catch (err) {
    console.error('Semantic search error:', err);
    return res.status(500).json({ error: 'Failed to run semantic search' });
  }
});

// Get media by user ID (must come before generic ID routes)
router.get('/user/:userId', authenticate, getMediaByUserId);

// Get media by Media Type Name (must come before generic ID or slug routes)
router.get('/byType/:mediaTypeName', getMediaByTypeName);

// Get media by slug (must come before ID routes)
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    console.log('Fetching media with slug:', slug);

    const mediaFile = await Media.findOne({ slug });

    if (!mediaFile) {
      console.log('Media not found for slug:', slug);
      return res.status(404).json({ error: 'Media not found' });
    }

    console.log('Fetched media file:', mediaFile);
    res.status(200).json(mediaFile);
  } catch (error) {
    console.error('Error fetching media file:', error);
    res.status(500).json({ error: 'Failed to fetch media file' });
  }
});

// Debug media file
router.get('/:id/debug', debugMediaFile);

// Get specific media by ID
router.get('/:id', getMediaById);

// --- Admin Approval Routes ---
const ensureAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'superAdmin')) {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden: Administrator access required.' });
};

router.post('/admin/:mediaId/approve', authenticate, ensureAdmin, approveMediaItem);
router.post('/admin/:mediaId/reject', authenticate, ensureAdmin, rejectMediaItem);
router.get('/admin/pending-review', authenticate, ensureAdmin, getPendingMediaReviews);
router.get('/admin/rejected', authenticate, ensureAdmin, getRejectedMedia);

// Batch download route
router.post('/batch-download', async (req, res) => {
  try {
    const { fileIds } = req.body;
    
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ error: 'No file IDs provided for batch download' });
    }

    console.log(`Batch download request received for ${fileIds.length} files`);
    
    // Find all requested media files
    const mediaFiles = await Media.find({ _id: { $in: fileIds } });
    
    if (!mediaFiles || mediaFiles.length === 0) {
      return res.status(404).json({ error: 'No files found for the provided IDs' });
    }
    
    console.log(`Found ${mediaFiles.length} files for batch download`);

    // Create a zip file for the batch download
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    // Set the appropriate headers for the response
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=media_files_${Date.now()}.zip`);
    
    // Pipe the archive to the response
    archive.pipe(res);
    
    // Download each file and add it to the archive
    for (const mediaFile of mediaFiles) {
      try {
        // Get the file extension from the mimetype or location
        let fileExtension = '';
        if (mediaFile.fileExtension) {
          fileExtension = `.${mediaFile.fileExtension.toLowerCase()}`;
        } else if (mediaFile.location) {
          const locationExt = mediaFile.location.split('.').pop();
          if (locationExt && locationExt.length <= 5) { // Reasonable extension length
            fileExtension = `.${locationExt.toLowerCase()}`;
          }
        }
        
        // Get base filename without extension
        let baseFileName = mediaFile.title || 
                        mediaFile.metadata?.fileName || 
                        mediaFile.location.split('/').pop() || 
                        `file_${mediaFile._id}`;
                        
        // Remove any existing extension from the baseFileName
        if (baseFileName.includes('.')) {
          const parts = baseFileName.split('.');
          if (parts.length > 1 && parts[parts.length - 1].length <= 5) {
            // If the last part looks like a file extension, remove it
            baseFileName = parts.slice(0, -1).join('.');
          }
        }
        
        // Create the full filename with proper extension
        const fileName = baseFileName + fileExtension;
        
        console.log(`Processing file for download: ${fileName}`);
        
        // Create a readable stream from the file URL
        const response = await axios({
          method: 'get',
          url: mediaFile.location,
          responseType: 'stream'
        });
        
        // Add the file to the archive with proper filename and extension
        archive.append(response.data, { name: fileName });
        console.log(`Added ${fileName} to the archive`);
      } catch (error) {
        console.error(`Error adding file ${mediaFile._id} to archive:`, error);
        // Continue with other files even if one fails
      }
    }
    
    // Finalize the archive
    await archive.finalize();
    console.log('Batch download archive finalized successfully');
  } catch (error) {
    console.error('Error processing batch download:', error);
    res.status(500).json({ error: 'Error processing batch download: ' + error.message });
  }
});

// Add a route to update media by ID
router.put('/update-by-id/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log('Received /update-by-id/:id request for id:', id);
    
    // Find the media file by ID to get its slug
    const mediaFile = await Media.findById(id).select('slug'); // Only select the slug
    
    if (!mediaFile || !mediaFile.slug) {
      console.log('Media not found or slug missing for id:', id);
      return res.status(404).json({ error: 'Media not found or slug is missing' });
    }
    
    console.log(`Found media with slug: ${mediaFile.slug}, forwarding to main updateMedia controller`);
    
    // Modify the request object to look like it came to /update/:slug
    req.params.slug = mediaFile.slug; // Set the slug on req.params for the updateMedia controller
    
    // Forward the request to the existing updateMedia controller
    // This requires updateMedia to be available in this scope, or to be called differently.
    // Assuming updateMedia is imported and available:
    return updateMedia(req, res, next); // Pass next for error handling in updateMedia

  } catch (error) {
    console.error('Error in /update-by-id/:id route handler:', error);
    // Ensure next is called if an error occurs before reaching updateMedia's own error handling
    next(error); 
  }
});

// Update the route for handling thumbnail uploads from the frontend
router.post('/update-thumbnail/:id', authenticate, upload.single('thumbnail'), async (req, res) => {
  try {
    const { id } = req.params;
    const { timestamp } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No thumbnail file uploaded' });
    }
    
    console.log(`Processing thumbnail update for media ID ${id} with uploaded file`);
    console.log(`File info:`, {
      mimetype: req.file.mimetype,
      size: req.file.size,
      originalname: req.file.originalname
    });
    
    // Find the media file to update
    const mediaFile = await Media.findById(id);
    if (!mediaFile) {
      return res.status(404).json({ error: 'Media file not found' });
    }
    
    // Check if there's an existing thumbnail that needs to be deleted
    if (mediaFile.metadata) {
      // Look for thumbnail in either field name (for compatibility)
      const oldThumbnailUrl = mediaFile.metadata.v_thumbnail || mediaFile.metadata.thumbnailUrl;
      if (oldThumbnailUrl && oldThumbnailUrl.includes('.s3.')) {
        try {
          console.log(`Deleting old thumbnail: ${oldThumbnailUrl}`);
          await deleteFileFromS3(oldThumbnailUrl).catch(err => {
            console.warn(`Failed to delete old thumbnail (continuing anyway): ${err.message}`);
          });
        } catch (error) {
          console.warn(`Error deleting old thumbnail (continuing anyway): ${error.message}`);
        }
      }
    }
    
    // Now upload the new thumbnail to S3
    console.log('Uploading thumbnail to S3');
    const thumbnailLocation = await uploadFileToS3({
      buffer: req.file.buffer,
      mimetype: req.file.mimetype,
      originalname: `${mediaFile.id}_thumbnail_${Date.now()}.jpg`
    });
    
    console.log('Successfully uploaded thumbnail to S3:', thumbnailLocation);
    
    // MODIFIED: Use direct MongoDB update like in updateThumbnail.js script
    const collection = mongoose.connection.db.collection('media');
    
    // Update operations for MongoDB
    const updateOperations = {
      $set: {
        'metadata.v_thumbnail': thumbnailLocation.Location
      },
      $unset: {
        'metadata.thumbnailUrl': ""
      }
    };
    
    // Add timestamp if provided
    if (timestamp) {
      updateOperations.$set['metadata.v_thumbnailTimestamp'] = timestamp;
      updateOperations.$unset['metadata.thumbnailTimestamp'] = "";
    }
    
    // Execute direct update
    const updateResult = await collection.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      updateOperations
    );
    
    console.log('Direct MongoDB update result:', JSON.stringify(updateResult, null, 2));
    
    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ error: 'Media document not found during update' });
    }
    
    if (updateResult.modifiedCount === 0) {
      console.warn('Warning: Document found but no changes were made');
    } else {
      console.log('Media document updated successfully with direct MongoDB operation');
    }
    
    // Fetch the updated document
    const updatedMediaFile = await Media.findById(id);
    
    // Return success response
    res.status(200).json({
      thumbnailUrl: thumbnailLocation.Location,
      mediaFile: updatedMediaFile
    });
  } catch (error) {
    console.error('Error updating thumbnail:', error);
    res.status(500).json({ error: 'Failed to update thumbnail', details: error.message });
  }
});

// Improve the video-proxy route with better error handling and cleanup
router.get('/video-proxy/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Video proxy request for media ID: ${id}`);
    
    // Find the media file to get its S3 URL
    const mediaFile = await Media.findById(id);
    if (!mediaFile || !mediaFile.location) {
      console.error(`Media file not found or missing location for ID: ${id}`);
      return res.status(404).json({ error: 'Media file not found' });
    }

    console.log(`Found media file: ${mediaFile.title}, location: ${mediaFile.location}`);

    // Set CORS headers to allow video streaming
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
    
    // Handle options requests for CORS preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    try {
      // Fetch the video stream from S3
      const videoResponse = await axios({
        method: 'GET',
        url: mediaFile.location,
        responseType: 'stream',
        // Forward range headers for video seeking
        headers: req.headers.range ? {
          'Range': req.headers.range
        } : {},
        // Add longer timeout for large videos
        timeout: 30000
      });
      
      console.log('S3 response status:', videoResponse.status);
      console.log('S3 response headers from S3:', JSON.stringify(videoResponse.headers, null, 2));
      
      // Copy important headers from S3 response
      const headersToForward = [
        'content-type', 
        'content-length', 
        'accept-ranges', 
        'content-range', 
        'etag',
        'last-modified'
      ];
      
      headersToForward.forEach(header => {
        if (videoResponse.headers[header]) {
          res.setHeader(header.charAt(0).toUpperCase() + header.slice(1), videoResponse.headers[header]);
        }
      });
      
      // Set proper status code for partial content
      if (req.headers.range && videoResponse.status === 206) {
        res.status(206);
      } else {
        res.status(200);
      }
      
      // Add error handler for the streaming
      videoResponse.data.on('error', (err) => {
        console.error('Stream error from S3:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Video streaming error' });
        } else {
          // Make sure the response is properly ended to avoid hanging connections
          res.end();
        }
      });
      
      // Add a completion handler
      videoResponse.data.on('end', () => {
        console.log(`Video streaming completed for media ID: ${id}`);
        // Ensure the response is properly ended
        if (!res.writableFinished) {
          res.end();
        }
      });
      
      // Log headers being sent to the client by the proxy, right before piping
      console.log('Proxy response headers TO CLIENT:', JSON.stringify(res.getHeaders(), null, 2));

      // Stream the video back to the client
      videoResponse.data.pipe(res);
      
      // Handle client disconnect
      req.on('close', () => {
        console.log('Client disconnected from video stream');
        // Clean up the stream to prevent memory leaks
        videoResponse.data.destroy();
      });
    } catch (streamError) {
      console.error('Error streaming from S3:', streamError);
      
      // Check if headers have already been sent
      if (!res.headersSent) {
        if (streamError.code === 'ECONNABORTED') {
          return res.status(504).json({ 
            error: 'Gateway timeout', 
            details: 'Video streaming took too long'
          });
        }
        
        if (streamError.response) {
          return res.status(streamError.response.status).json({
            error: `S3 error: ${streamError.response.status}`,
            details: streamError.message
          });
        }
        
        return res.status(500).json({ 
          error: 'Failed to stream video from S3', 
          details: streamError.message 
        });
      } else {
        // Ensure the response is properly ended
        res.end();
      }
    }
  } catch (error) {
    console.error('Video proxy error:', error);
    
    // Only send error response if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to proxy video', details: error.message });
    } else {
      // Ensure the response is properly ended
      res.end();
    }
  }
});

// Add thumbnail generation endpoint based on timestamp
router.post('/update/timestamp-thumbnail/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { timestamp } = req.body;
    
    if (!timestamp) {
      return res.status(400).json({ error: 'Timestamp is required' });
    }
    
    console.log(`Processing thumbnail generation for media ID ${id} with timestamp ${timestamp}`);
    
    // Import the video service
    const { generateThumbnailFromTimestamp } = await import('../services/videoService.js');
    
    // Find the media file to update
    const mediaFile = await Media.findById(id);
    if (!mediaFile) {
      return res.status(404).json({ error: 'Media file not found' });
    }
    
    // Get the video URL
    const videoUrl = mediaFile.location;
    if (!videoUrl) {
      return res.status(400).json({ error: 'Media file does not have a valid video URL' });
    }
    
    // Check if there's an existing thumbnail that needs to be deleted
    if (mediaFile.metadata) {
      // Look for thumbnail in either field name (for compatibility)
      const oldThumbnailUrl = mediaFile.metadata.v_thumbnail || mediaFile.metadata.thumbnailUrl;
      if (oldThumbnailUrl && oldThumbnailUrl.includes('.s3.')) {
        try {
          console.log(`Deleting old thumbnail: ${oldThumbnailUrl}`);
          await deleteFileFromS3(oldThumbnailUrl).catch(err => {
            console.warn(`Failed to delete old thumbnail (continuing anyway): ${err.message}`);
          });
        } catch (error) {
          console.warn(`Error deleting old thumbnail (continuing anyway): ${error.message}`);
        }
      }
    }
    
    // Generate thumbnail at the specified timestamp
    const thumbnailResult = await generateThumbnailFromTimestamp(videoUrl, id, timestamp);
    const thumbnailUrl = thumbnailResult.thumbnailUrl;
    
    // MODIFIED: Use direct MongoDB update instead of Mongoose save
    // This approach uses the same technique that worked in the updateThumbnail.js script
    const collection = mongoose.connection.db.collection('media');
    
    // Update the document directly in MongoDB
    const updateResult = await collection.updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { 
        $set: { 
          'metadata.v_thumbnail': thumbnailUrl,
          'metadata.v_thumbnailTimestamp': timestamp 
        },
        $unset: { 
          'metadata.thumbnailUrl': "",
          'metadata.thumbnailTimestamp': "" 
        }
      }
    );
    
    console.log('Direct MongoDB update result:', JSON.stringify(updateResult, null, 2));
    
    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ error: 'Media document not found during update' });
    }
    
    if (updateResult.modifiedCount === 0) {
      console.warn('Warning: Document found but no changes were made');
    } else {
      console.log('Media document updated successfully with direct MongoDB operation');
    }
    
    // Verify the update by fetching the latest document
    const updatedMediaFile = await Media.findById(id);
    console.log('Updated document thumbnail URL:', updatedMediaFile.metadata?.v_thumbnail);
    
    // Track the update activity if user is authenticated
    if (req.user) {
      // Create more descriptive detail message for the activity log
      const changedFields = ['metadata.v_thumbnail', 'metadata.v_thumbnailTimestamp'];
      
      // Format a more descriptive details message that will show up in the activity log
      const details = `Updated video thumbnail at timestamp ${timestamp} for ${updatedMediaFile.title || updatedMediaFile.metadata?.fileName || 'Untitled'} (${changedFields.join(', ')})`;
      
      // Use custom details with the tracking service
      await LoggerService.logActivity({
        userId: req.user.id,
        username: req.user.username || req.user.email,
        action: 'EDIT',
        details: details,
        resourceType: 'media',
        resourceId: updatedMediaFile.id || updatedMediaFile._id,
        mediaSlug: updatedMediaFile.slug
      });
      
      console.log('Media thumbnail update activity logged with details:', details);
    }
    
    // Return success response with the thumbnail URL
    res.status(200).json({
      success: true,
      message: 'Thumbnail generated successfully',
      timestamp: timestamp,
      thumbnailUrl: thumbnailUrl,
      mediaFile: updatedMediaFile
    });
  } catch (error) {
    console.error('Error processing timestamp-based thumbnail request:', error);
    res.status(500).json({ 
      error: 'Failed to process thumbnail request',
      details: error.message
    });
  }
});

// Fix the thumbnail-proxy endpoint to prevent infinite loops
router.get('/thumbnail-proxy/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    console.log(`Thumbnail proxy request for file: ${filename}`);
    
    // Construct the S3 URL using the bucket name and region
    const s3Bucket = process.env.AWS_S3_BUCKET_NAME;
    const region = process.env.AWS_REGION || 'us-east-1';
    const s3Url = `https://${s3Bucket}.s3.${region}.amazonaws.com/${filename}`;
    
    // Set CORS headers to allow image loading
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    // Important: Set proper caching headers to discourage browsers from continuous re-fetching
    // Cache for 1 hour - this helps prevent the infinite loop issue
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Expires', new Date(Date.now() + 3600000).toUTCString());
    
    console.log(`Attempting to fetch from S3: ${s3Url}`);
    
    try {
      // Stream the image from S3
      const response = await axios({
        method: 'GET',
        url: s3Url,
        responseType: 'arraybuffer', // Use arraybuffer instead of stream to handle errors better
        timeout: 5000
      });
      
      // Set the content type from the S3 response
      if (response.headers['content-type']) {
        res.setHeader('Content-Type', response.headers['content-type']);
      } else {
        res.setHeader('Content-Type', 'image/jpeg');
      }
      
      // Send the image data directly (not as a stream)
      return res.send(response.data);
      
    } catch (error) {
      console.error('S3 fetch error:', error.message);
      
      // If we get a 403 Forbidden error, return a placeholder image to avoid continuous retries
      if (error.response && error.response.status === 403) {
        console.log('Access denied (403) from S3. Returning placeholder SVG image.');
        
        // Send a simple SVG as placeholder
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
        
        // Simple placeholder SVG
        const svg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
            <rect width="300" height="200" fill="#e0e0e0"/>
            <text x="150" y="100" font-family="Arial" font-size="14" text-anchor="middle" fill="#888">
              Thumbnail Not Available
            </text>
          </svg>
        `;
        
        return res.send(svg);
      }
      
      // For other errors
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=60'); // Cache for 1 minute
      
      // Error SVG
      const errorSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
          <rect width="300" height="200" fill="#ffe0e0"/>
          <text x="150" y="100" font-family="Arial" font-size="14" text-anchor="middle" fill="#cc0000">
            Error Loading Image
          </text>
        </svg>
      `;
      
      return res.send(errorSvg);
    }
  } catch (error) {
    console.error('Thumbnail proxy error:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

export default router;

