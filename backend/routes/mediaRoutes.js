import express from 'express';
import multer from 'multer';
import { uploadMedia } from '../controllers/mediaController.js';
import Media from '../models/Media.js';

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

router.post('/upload', upload.single('file'), (req, res, next) => {
  console.log('Received upload request');
  next();
}, uploadMedia);


export default router;