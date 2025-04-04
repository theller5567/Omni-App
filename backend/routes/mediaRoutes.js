import express from 'express';
import multer from 'multer';
import MediaType from '../models/MediaType.js';
import Media from '../models/Media.js';
import { uploadMedia, getAllMedia, deleteMedia } from '../controllers/mediaController.js';

const router = express.Router();
const upload = multer();

router.put('/update/:slug', async (req, res) => {
  const { slug } = req.params;
  console.log('Received update request for slug:', slug);
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  try {
    // Fetch the document using the Media model
    const documentBeforeUpdate = await Media.findOne({ slug });
    if (!documentBeforeUpdate) {
      console.log('Media not found for slug:', slug);
      return res.status(404).json({ error: 'Media not found' });
    }

    console.log('Document before update:', JSON.stringify(documentBeforeUpdate, null, 2));

    // Build update fields
    const updateFields = {
      title: req.body.title,
      ...Object.entries(req.body.metadata).reduce((acc, [key, value]) => {
        acc[`metadata.${key}`] = value;
        return acc;
      }, {})
    };

    console.log('Constructed updateFields:', JSON.stringify(updateFields, null, 2));

    // Perform the update using the Media model
    const updatedMediaFile = await Media.findOneAndUpdate(
      { slug },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedMediaFile) {
      console.log('Media not found for slug:', slug);
      return res.status(404).json({ error: 'Media not found' });
    }

    // Log the document after update
    console.log('Updated media file:', JSON.stringify(updatedMediaFile, null, 2));

    res.status(200).json(updatedMediaFile);
  } catch (error) {
    console.error('Error updating media file:', error);

    // Log validation errors if present
    if (error.errors) {
      Object.values(error.errors).forEach(err => {
        console.error('Validation error:', err.message);
      });
    }

    res.status(500).json({ error: 'Failed to update media file' });
  }
});

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

router.post('/upload', upload.single('file'), async (req, res, next) => {
  console.log('Received upload request', req.body);
  console.log('Tags in request:', req.body.metadata?.tags);
  
  try {
    const mediaType = req.body.mediaType;
    console.log('Received media type:', mediaType);
    
    // Fetch media types using the MediaType model
    const mediaTypes = await MediaType.find();
    console.log('test:', mediaTypes);
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
}, uploadMedia);

router.delete('/delete/:id', deleteMedia);

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

export default router;

