import express from 'express';
import multer from 'multer';
import { uploadMedia, deleteMedia } from '../controllers/mediaController.js';
import { Media } from '../models/Media.js';
import { mediaTypes } from '../config/mediaTypes.js';


const router = express.Router();
const upload = multer();

// New route to get all media files
router.get('/all', async (req, res) => {
  try {
    const mediaFiles = await Media.find();
    res.status(200).json(mediaFiles);
  } catch (error) {
    console.error('Error fetching media files:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// New route to get media by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    console.log('slug2', slug);
    const mediaFile = await Media.findOne({ slug });
    if (!mediaFile) {
      return res.status(404).json({ error: 'Media not found' });
    }
    res.status(200).json(mediaFile);
  } catch (error) {
    console.error('Error fetching media by slug:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/update/:slug', async (req, res) => {
  const { slug } = req.params;
  console.log('slug - mediaRoutes', slug);
  const { fileName, description, tags } = req.body.metadata; // Ensure metadata is accessed correctly
  console.log('Request body:', req.body); // Log the request body

  try {
    const updatedMediaFile = await Media.findOneAndUpdate(
      { slug }, // Use slug to find the document
      { 
        $set: { // Use $set to ensure fields are updated
          'metadata.fileName': fileName, 
          'metadata.description': description, 
          'metadata.tags': tags 
        }
      },
      { new: true }
    );

    if (!updatedMediaFile) {
      console.log('Media not found');
      return res.status(404).json({ error: 'Media not found' });
    }

    console.log('updatedMediaFile', updatedMediaFile);
    res.status(200).json(updatedMediaFile);
  } catch (error) {
    console.error('Error updating media file:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/upload', upload.single('file'), (req, res, next) => {
  console.log('Received upload request');
  next();
}, uploadMedia);

router.delete('/delete/:id', (req, res, next) => {
  console.log('Received delete request');
  next();
}, deleteMedia);

router.get('/media-types', (req, res) => {
  res.json(mediaTypes);
});

export default router;