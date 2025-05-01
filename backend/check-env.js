// Utility script to check AWS environment variables
console.log('Checking AWS environment variables:');
console.log('-----------------------------------');
console.log('AWS_REGION:', process.env.AWS_REGION || 'not set');
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'set' : 'not set');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'set' : 'not set');
console.log('AWS_S3_BUCKET:', process.env.AWS_S3_BUCKET || 'not set');
console.log('AWS_S3_BUCKET_NAME:', process.env.AWS_S3_BUCKET_NAME || 'not set');
console.log('-----------------------------------');

// Check if the bucket name is properly set
const bucketName = process.env.AWS_S3_BUCKET || process.env.AWS_S3_BUCKET_NAME;
if (!bucketName) {
  console.error('WARNING: No S3 bucket name is configured. Set AWS_S3_BUCKET in your environment variables.');
} else {
  console.log('Using bucket:', bucketName);
}

// Log the inferred S3 URL format that would be used
if (process.env.AWS_REGION && bucketName) {
  console.log('S3 URL format would be:', `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/your-file-key`);
} 