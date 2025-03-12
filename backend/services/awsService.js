import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Configure AWS SDK
const s3 = new S3Client({
  region: process.env.AWS_REGION, // e.g., "us-west-2"
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

export const uploadFileToS3 = async (file, uniqueId) => {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  if (!bucketName) {
    throw new Error('AWS_S3_BUCKET_NAME environment variable is not set');
  }

  const key = `${uniqueId}/${file.originalname}`;
  console.log('Starting file upload to S3...');
  console.log(`File name: ${file.originalname}, Key: ${key}`);
  const params = {
    Bucket: bucketName, // Ensure this environment variable is set
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {
    const command = new PutObjectCommand(params);
    await s3.send(command);
    const fileUrl = generateMediaFileUrl(bucketName, key);
    console.log('File uploaded successfully:', fileUrl);
    return fileUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

export const deleteFileFromS3 = async (key) => {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  if (!bucketName) {
    throw new Error('AWS_S3_BUCKET_NAME environment variable is not set');
  }

  const params = {
    Bucket: bucketName, // Ensure this environment variable is set
    Key: key,
  };
  console.log('Deleting file with key:', key);
  try {
    await s3.send(new DeleteObjectCommand(params));
    console.log('File deleted successfully:', key);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

const generateMediaFileUrl = (bucketName, key) => {
  return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};
