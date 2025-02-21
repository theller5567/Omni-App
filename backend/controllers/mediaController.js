import { uploadFileToS3 } from '../services/awsService.js';
import { v4 as uuidv4 } from 'uuid';
import { getDatabaseConnection } from '../config/db.js';

const generateSlug = (title) => {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${uuidv4()}`;
};

const saveMediaToDatabase = async (mediaData) => {
  const db = await getDatabaseConnection();
  await db.collection('media').insertOne(mediaData);
};

export const uploadMedia = async (req, res) => {
  try {
    const { title, metadata } = req.body;
    const file = req.file;

    if (!file || !title) {
      return res.status(400).json({ error: 'File and title are required' });
    }

    const slug = generateSlug(title);
    const location = await uploadFileToS3(file);
    const parsedMetadata = metadata ? JSON.parse(metadata) : {};

    const mediaData = {
      id: uuidv4(),
      title,
      slug,
      metadata: parsedMetadata,
      location,
    };

    await saveMediaToDatabase(mediaData);

    res.status(200).json({ location, slug, mediaData });
  } catch (error) {
    console.error('Error uploading media:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
};