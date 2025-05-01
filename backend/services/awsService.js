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

// Export the BUCKET_NAME constant
export const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET;

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

// Update the validation code to check for both variable names
// Validate AWS configuration
if (!BUCKET_NAME) {
  console.error('AWS S3 bucket name is not set. Please set AWS_S3_BUCKET_NAME environment variable.');
}

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.error('AWS credentials are not properly configured');
}

export const uploadFileToS3 = async ({ bucket, key, body, contentType, originalName, formattedName, isThumbnail = false }) => {
  try {
    // Validate input parameters
    if (!bucket) {
      bucket = BUCKET_NAME;
      if (!bucket) {
        throw new Error('S3 bucket not specified and no default bucket is configured');
      }
    }
    
    if (!key) {
      if (!formattedName) {
        throw new Error('Neither key nor formattedName provided for S3 upload');
      }
      key = formattedName;
    }
    
    if (!body) {
      throw new Error('No body/content provided for S3 upload');
    }
    
    // Detect content type if not specified
    if (!contentType) {
      // Try to determine content type from file extension
      if (originalName) {
        const ext = path.extname(originalName).toLowerCase();
        switch (ext) {
          case '.jpg':
          case '.jpeg':
            contentType = 'image/jpeg';
            break;
          case '.png':
            contentType = 'image/png';
            break;
          case '.svg':
            contentType = 'image/svg+xml';
            break;
          case '.mp4':
            contentType = 'video/mp4';
            break;
          case '.webm':
            contentType = 'video/webm';
            break;
          default:
            contentType = 'application/octet-stream';
        }
      } else {
        contentType = 'application/octet-stream';
      }
    }
    
    // Set up the upload parameters
    const params = {
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      // Add metadata to help identify the file
      Metadata: {
        'original-name': originalName || 'unknown',
        'upload-date': new Date().toISOString(),
        'is-thumbnail': isThumbnail ? 'true' : 'false'
      }
    };
    
    // Log the upload attempt
    console.log(`Uploading to S3: ${bucket}/${key} (${contentType}) - Size: ${body.length || 'unknown'} bytes`);
    
    // Use the appropriate S3 client based on what's available in this file
    let result;
    if (typeof s3 !== 'undefined' && s3.upload) {
      // Use the v2 SDK if available
      result = await s3.upload(params).promise();
    } else if (typeof s3Client !== 'undefined') {
      // Use the v3 SDK if available
      const command = new PutObjectCommand(params);
      result = await s3Client.send(command);
      
      // V3 doesn't return Location directly, so construct it
      result.Location = `https://${bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
      result.Key = key;
      result.Bucket = bucket;
    } else {
      throw new Error('No S3 client available');
    }
    
    // Log success
    console.log(`S3 upload successful: ${result.Location}`);
    
    return result;
  } catch (error) {
    // Enhanced error logging
    console.error(`S3 upload error: ${error.message}`, error);
    
    // Add more context to the error
    const enhancedError = new Error(`S3 upload failed: ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.params = {
      bucket,
      key,
      contentType,
      originalName,
      size: body ? (body.length || 'unknown') : 'no body provided'
    };
    
    throw enhancedError;
  }
};

export const deleteFileFromS3 = async (fileUrl) => {
  try {
    if (!BUCKET_NAME) {
      throw new Error('AWS S3 bucket name is not configured');
    }

    // Log the full URL for debugging
    console.log('Attempting to delete file with URL:', fileUrl);
    
    // Handle different URL formats
    let key;
    
    if (!fileUrl) {
      throw new Error('No file URL provided');
    }
    
    if (fileUrl.includes('amazonaws.com')) {
      // This is a full S3 URL
      // Parse the URL to extract the key after the bucket name
      const urlParts = fileUrl.split('/');
      // Find the position of the bucket name
      const bucketIndex = urlParts.findIndex(part => part.includes(BUCKET_NAME));
      
      if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
        // The key is everything after the bucket name
        key = urlParts.slice(bucketIndex + 1).join('/');
      } else {
        // Fallback to the last part of the URL
        key = urlParts[urlParts.length - 1];
      }
    } else if (fileUrl.startsWith('/')) {
      // This is a path without hostname
      key = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
    } else {
      // This might be just the key
      key = fileUrl;
    }
    
    // Remove any query parameters
    if (key && key.includes('?')) {
      key = key.split('?')[0];
    }
    
    if (!key) {
      throw new Error('Could not extract file key from URL: ' + fileUrl);
    }

    console.log('Extracted S3 key for deletion:', key);
    
    const deleteParams = {
      Bucket: BUCKET_NAME,
      Key: key
    };

    console.log('Deleting from S3:', {
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
