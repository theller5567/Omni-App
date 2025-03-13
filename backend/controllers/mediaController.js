import { uploadFileToS3, deleteFileFromS3 } from '../services/awsService.js';
import { v4 as uuidv4 } from 'uuid';
import { getDatabaseConnection } from '../config/db.js';
import { Media } from '../models/Media.js';
import { mediaTypes } from '../config/mediaTypes.js';

const generateSlug = (title) => {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${uuidv4()}`;
};

const generateMediaFileUrl = (key) => {
  return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

export const uploadMedia = async (req, res) => {
  try {
    const { title, metadata, mediaType } = req.body;
    const file = req.file;

    if (!file || !title) {
      console.error('File or title missing');
      return res.status(400).json({ error: 'File and title are required' });
    }

    console.log('Received file for upload:', file.originalname);

    const id = uuidv4();
    const key = `${id}/${file.originalname}`;
    try {
      const location = await uploadFileToS3(file, id);
      console.log('File uploaded to S3 at:', location);
    } catch (uploadError) {
      console.error('Failed to upload file to S3:', uploadError);
      return res.status(500).json({ error: 'Failed to upload file to S3' });
    }

    const mediaData = {
      id, // Use the generated UUID
      title,
      slug: generateSlug(title),
      fileSize: file.size,
      fileExtension: file.originalname.split('.').pop()?.toUpperCase() || 'UNKNOWN',
      modifiedDate: new Date(),
      metadata: metadata ? JSON.parse(metadata) : {},
      location: generateMediaFileUrl(key), // Use the function here
    };

    // Convert recordedDate to a Date object if it exists
    if (mediaData.metadata.recordedDate) {
      mediaData.metadata.recordedDate = new Date(mediaData.metadata.recordedDate);
    }

    await getDatabaseConnection(); // Ensure the database connection is established

    const MediaTypeModel = Media.discriminators[mediaType];
    if (!MediaTypeModel) {
      return res.status(400).json({ error: 'Invalid media type' });
    }

    const newMedia = new MediaTypeModel(mediaData);
    await newMedia.save();

    console.log('Media file saved to database:', newMedia);
    res.status(200).json(newMedia);
  } catch (error) {
    console.error('Error uploading media:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
};

export const deleteMedia = async (req, res) => {
  const { id } = req.params;
  try {
    await getDatabaseConnection(); // Ensure the database connection is established
    const mediaFile = await Media.findOneAndDelete({ id });
    if (!mediaFile) {
      return res.status(404).json({ error: 'Media not found' });
    }
    console.log('Deleting file with key:', mediaFile.location);
    const key = mediaFile.location.split(`${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`)[1];
    await deleteFileFromS3(key);
    res.status(200).json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
