import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import models from '../models/Index.js'; // Import the centralized model storage
import { uploadMedia, getAllMedia, deleteMedia } from '../controllers/mediaController.js';

const router = express.Router();
const upload = multer();

const mediaSchema = new mongoose.Schema({}, { strict: false }); // Use a flexible schema
const Media = mongoose.model('Media', mediaSchema, 'media'); // Specify the collection name

router.put('/update/:slug', async (req, res) => {
  const { slug } = req.params;
  console.log('Received update request for slug:', slug);
  console.log('Request body:', JSON.stringify(req.body, null, 2));

  try {
    // Fetch the document to determine the media type
    const documentBeforeUpdate = await models.ProductImage.findOne({ slug }) || await models.WebinarVideo.findOne({ slug });
    if (!documentBeforeUpdate) {
      console.log('Media not found for slug:', slug);
      return res.status(404).json({ error: 'Media not found' });
    }

    console.log('Document before update:', JSON.stringify(documentBeforeUpdate, null, 2));

    // Determine the model based on the mediaType property
    const mediaType = documentBeforeUpdate.mediaType;
    const Model = models[mediaType];

    if (!Model) {
      console.error('No model found for media type:', mediaType);
      return res.status(400).json({ error: 'Invalid media type' });
    }

    // Build update fields
    const updateFields = {
      title: req.body.title,
      ...Object.entries(req.body.metadata).reduce((acc, [key, value]) => {
        acc[`metadata.${key}`] = value;
        return acc;
      }, {})
    };

    console.log('Constructed updateFields:', JSON.stringify(updateFields, null, 2));

    // Perform the update
    const updatedMediaFile = await Model.findOneAndUpdate(
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
    const mediaTypes = {};

    // Iterate over each model in the models object
    for (const modelName in models) {
      if (models.hasOwnProperty(modelName) && modelName !== 'User' && modelName !== 'File') {
        const Model = models[modelName];
        // Assume each model has a schema property with paths
        const schemaPaths = Model.schema.paths;
        const schema = {};

        // Construct the schema object for each model
        for (const path in schemaPaths) {
          console.log('Path:', path);
          if (schemaPaths.hasOwnProperty(path)) {
            schema[path] = { type: schemaPaths[path].instance };
          }
        }

        mediaTypes[modelName] = { schema };
      }
    }

    res.status(200).json(mediaTypes);
  } catch (error) {
    console.error('Error generating media types:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/upload', upload.single('file'), (req, res, next) => {
  console.log('Received upload request', req.body);
  console.log('Tags in request:', req.body.metadata.tags);
  next();
}, uploadMedia);

router.delete('/delete/:id', deleteMedia);

router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    console.log('Fetching media with slug:', slug);

    // Fetch the document to determine the media type
    const documentBeforeFetch = await models.ProductImage.findOne({ slug }) || await models.WebinarVideo.findOne({ slug });
    if (!documentBeforeFetch) {
      console.log('Media not found for slug:', slug);
      return res.status(404).json({ error: 'Media not found' });
    }

    // Determine the model based on the mediaType property
    const mediaType = documentBeforeFetch.mediaType;
    const Model = models[mediaType];

    if (!Model) {
      console.error('No model found for media type:', mediaType);
      return res.status(400).json({ error: 'Invalid media type' });
    }

    // Fetch the media file using the correct model
    const mediaFile = await Model.findOne({ slug });

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

