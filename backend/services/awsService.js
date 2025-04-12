import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Configure AWS S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

// Helper function to format the filename
const formatFileName = (originalName) => {
  // Get the file extension
  const ext = path.extname(originalName).toLowerCase().slice(1);
  
  // Get the base name without extension and clean it
  const baseName = path.basename(originalName, path.extname(originalName))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
  
  // Get current date in MMDDYYYY format
  const date = new Date();
  const dateStr = date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '');
  
  // Combine all parts with underscores
  return `${baseName}_${ext}_${dateStr}`;
};

// Validate AWS configuration
if (!process.env.AWS_S3_BUCKET_NAME) {
  console.error('AWS_S3_BUCKET_NAME environment variable is not set');
}

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.error('AWS credentials are not properly configured');
}

export const uploadFileToS3 = async (file, prefix = '') => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    if (!BUCKET_NAME) {
      throw new Error('AWS S3 bucket name is not configured');
    }

    // Determine if this is a thumbnail upload
    const isThumbnail = file.originalname.includes('_thumbnail_');

    // Use the original thumbnail name if it's a thumbnail, otherwise format the filename
    const finalFilename = isThumbnail ? file.originalname : formatFileName(file.originalname);

    // Generate the unique filename with prefix
    const uniqueFilename = prefix ? `${prefix}${finalFilename}` : finalFilename;

    // Log upload attempt
    console.log('Attempting S3 upload:', {
      bucket: BUCKET_NAME,
      key: uniqueFilename,
      contentType: file.mimetype,
      fileSize: file.size,
      originalName: file.originalname,
      formattedName: finalFilename,
      isThumbnail: isThumbnail
    });

    // Prepare the upload parameters
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: uniqueFilename,
      Body: file.buffer,
      ContentType: file.mimetype
    };

    // Upload to S3 using the v3 SDK
    const command = new PutObjectCommand(uploadParams);
    const result = await s3Client.send(command);
    
    // V3 doesn't return Location directly, so we need to construct it
    const location = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFilename}`;
    
    if (!location) {
      throw new Error('S3 upload successful but location not returned');
    }

    console.log('S3 upload successful:', {
      location: location,
      key: uniqueFilename,
      bucket: BUCKET_NAME
    });

    return {
      Location: location,
      Key: uniqueFilename,
      Bucket: BUCKET_NAME
    };
  } catch (error) {
    console.error('Error uploading to S3:', error);
    
    // Enhanced error reporting
    const errorDetails = {
      originalError: error.message,
      bucketName: BUCKET_NAME,
      fileInfo: file ? {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size
      } : 'No file provided'
    };
    
    console.error('Upload error details:', errorDetails);
    throw new Error(`Failed to upload to S3: ${error.message}`);
  }
};

export const deleteFileFromS3 = async (fileUrl) => {
  try {
    if (!BUCKET_NAME) {
      throw new Error('AWS S3 bucket name is not configured');
    }

    // Extract the key from the URL
    const key = fileUrl.split('/').pop();
    
    if (!key) {
      throw new Error('Could not extract file key from URL');
    }

    const deleteParams = {
      Bucket: BUCKET_NAME,
      Key: key
    };

    console.log('Attempting to delete from S3:', {
      bucket: BUCKET_NAME,
      key: key
    });

    // Delete using v3 SDK
    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);
    
    console.log('Successfully deleted from S3:', {
      bucket: BUCKET_NAME,
      key: key
    });

    return true;
  } catch (error) {
    console.error('Error deleting from S3:', error);
    throw new Error(`Failed to delete from S3: ${error.message}`);
  }
};
