import { uploadFileToS3, deleteFileFromS3 } from '../services/awsService.js';
import { v4 as uuidv4 } from 'uuid';
import { getDatabaseConnection } from '../config/db.js';
import mongoose from 'mongoose';
import Media from '../models/Media.js';

const generateSlug = (title) => {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${uuidv4()}`;
};

export const uploadMedia = async (req, res) => {
  try {
    console.log('Received upload request', req.body);

    // Log the tags to ensure they are being received correctly
    console.log('Tags in request:', req.body.metadata.tags);

    const { title, metadata, mediaType, uploadedBy, modifiedBy } = req.body;
    const file = req.file;
    console.log('Uploading media with metadata:', metadata);
    if (!file || !title || !uploadedBy || !modifiedBy || !mediaType) {
      console.error('File, title, uploadedBy, modifiedBy, and mediaType are required');
      return res.status(400).json({ error: 'File, title, uploadedBy, modifiedBy, and mediaType are required' });
    }

    const id = uuidv4();
    let location;

    try {
      location = await uploadFileToS3(file, uploadedBy);
      console.log('File uploaded to S3 at:', location);
    } catch (uploadError) {
      console.error('Failed to upload file to S3:', uploadError);
      return res.status(500).json({ error: 'Failed to upload file to S3' });
    }

    const mediaData = {
      id,
      title,
      slug: generateSlug(title),
      fileSize: file.size,
      fileExtension: file.originalname.split('.').pop()?.toUpperCase() || 'UNKNOWN',
      modifiedDate: new Date(),
      uploadedBy,
      modifiedBy,
      mediaType,
      metadata: {
        ...metadata,
        tags: Array.isArray(metadata.tags) ? metadata.tags : [],
      },
      location,
    };

    // Convert recordedDate to a Date object if it exists
    if (mediaData.metadata.recordedDate) {
      mediaData.metadata.recordedDate = new Date(mediaData.metadata.recordedDate);
    }

    await getDatabaseConnection(); // Ensure the database connection is established

    // Create a new Media document using the imported Media model
    const newMedia = new Media(mediaData);
    console.log('Attempting to save new media:', newMedia);
    const savedMedia = await newMedia.save();
    console.log('Media saved successfully:', savedMedia);
    res.status(201).json(savedMedia);
  } catch (error) {
    console.error('Error saving media:', error);

    // Check for validation errors
    if (error.name === 'ValidationError') {
      Object.values(error.errors).forEach(err => {
        console.error('Validation error:', err.message);
      });
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }

    // Log any other errors
    res.status(500).json({ error: 'Failed to save media', details: error.message });
  }
};

export const deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting media with id:', id);

    const result = await Media.findOneAndDelete({ _id: id });

    if (!result) {
      console.log('Media not found for id:', id);
      return res.status(404).json({ error: 'Media not found' });
    }

    console.log('Deleted media:', result);
    res.status(200).json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ error: 'Failed to delete media' });
  }
};

export const getAllMedia = async (req, res) => {
  try {
    // Query only the Media collection
    const allMedia = await Media.find();
    res.status(200).json(allMedia);
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
};


