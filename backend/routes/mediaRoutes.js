import express from 'express';
import multer from 'multer';
import MediaType from '../models/MediaType.js';
import Media from '../models/Media.js';
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

router.put('/update/:slug', updateMedia);

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

router.post('/upload', uploadFields, async (req, res, next) => {
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

router.delete('/delete/:id', deleteMedia);

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

export default router;

