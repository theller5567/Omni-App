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
import { 
  getAllMedia, 
  getMediaById, 
  updateMedia, 
  deleteMedia, 
  uploadMedia,
  searchMedia,
  debugMediaFile
} from '../controllers/mediaController.js';

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
    const mediaType = req.body.mediaType;
    console.log('Received media type:', mediaType);
    
    // Fetch media types using the MediaType model
    const mediaTypes = await MediaType.find();
    console.log('Available media types:', mediaTypes.map(t => t.name));
    
    if (!mediaType || !mediaTypes.some(type => type.name === mediaType)) {
      console.error(`Invalid media type: ${mediaType}`);
      return res.status(400).json({ error: `Invalid media type: ${mediaType}` });
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
router.put('/update-by-id/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Received update request for id:', id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Find the media file
    const mediaFile = await Media.findById(id);
    
    if (!mediaFile) {
      console.log('Media not found for id:', id);
      return res.status(404).json({ error: 'Media not found' });
    }
    
    // Save the original state before updates for comparison
    const originalTitle = mediaFile.title;
    const originalMetadata = { ...mediaFile.metadata };
    
    // Extract update data
    const { title, metadata } = req.body;
    
    // Update fields
    if (title) mediaFile.title = title;
    
    // Update metadata fields
    if (metadata) {
      // Ensure metadata exists
      if (!mediaFile.metadata) mediaFile.metadata = {};
      
      // Update each metadata field
      for (const [key, value] of Object.entries(metadata)) {
        if (value !== undefined) {
          mediaFile.metadata[key] = value;
        }
      }
    }
    
    // Save the updated media file
    await mediaFile.save();
    console.log('Media file updated successfully');
    
    // Track the update activity if user is authenticated
    if (req.user) {
      // Determine which fields were changed
      const changedFields = [];
      if (title && title !== originalTitle) changedFields.push('title');
      
      if (metadata) {
        Object.keys(metadata).forEach(key => {
          if (JSON.stringify(metadata[key]) !== JSON.stringify(originalMetadata?.[key])) {
            changedFields.push(`metadata.${key}`);
          }
        });
      }
      
      // Log the activity
      await ActivityTrackingService.trackMediaUpdate(req.user, mediaFile, changedFields);
      console.log('Media update activity logged with changes:', changedFields);
    } else {
      console.log('Warning: Media file was updated but no user was attached to the request. Activity not logged.');
    }
    
    res.status(200).json(mediaFile);
  } catch (error) {
    console.error('Error updating media file by ID:', error);
    res.status(500).json({ error: 'Failed to update media file' });
  }
});

export default router;

