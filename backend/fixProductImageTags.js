import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get current file's directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the absolute path to the .env file in the project root
const envPath = path.resolve(__dirname, '../.env');
console.log('Loading environment variables from:', envPath);

// Load environment variables from the absolute path
dotenv.config({ path: envPath });

// Path to the controller file
const controllerPath = path.join(__dirname, 'controllers', 'mediaTypeController.js');

// Function to patch the getFilesNeedingTags function with case-insensitive comparison
const patchControllerFile = () => {
  try {
    console.log('Reading controller file:', controllerPath);
    
    // Read the current file content
    const fileContent = fs.readFileSync(controllerPath, 'utf8');
    
    // Check if our fix is already applied
    if (fileContent.includes('Array.isArray(file.metadata?.tags)')) {
      console.log('Fix already applied to getFilesNeedingTags function');
      return true;
    }
    
    // Replace the relevant parts with our fixed code
    
    // 1. Replace in getFilesNeedingTags function
    let updatedContent = fileContent.replace(
      /for \(const file of mediaFiles\) \{\s*const existingTags = file\.metadata\?\.tags \|\| \[\];/g,
      `for (const file of mediaFiles) {
      // Ensure we're working with an array of tags, converting to lowercase for case-insensitive comparison
      const existingTags = Array.isArray(file.metadata?.tags) 
        ? file.metadata.tags.map(tag => typeof tag === 'string' ? tag.toLowerCase() : tag)
        : [];
      
      // Convert default tags to lowercase for case-insensitive comparison
      const defaultTagsLower = mediaType.defaultTags.map(tag => 
        typeof tag === 'string' ? tag.toLowerCase() : tag
      );`
    );
    
    // 2. Replace the check for missing tags
    updatedContent = updatedContent.replace(
      /const needsUpdate = mediaType\.defaultTags\.some\(tag => !existingTags\.includes\(tag\)\);/g,
      `// Check if any default tag is missing using case-insensitive comparison
      const missingTags = defaultTagsLower.filter(defaultTag => 
        !existingTags.includes(defaultTag)
      );
      
      const needsUpdate = missingTags.length > 0;`
    );
    
    // 3. Update the missing tags reporting in getFilesNeedingTags
    updatedContent = updatedContent.replace(
      /missingTags: mediaType\.defaultTags\.filter\(tag => !existingTags\.includes\(tag\)\)/g,
      `missingTags: mediaType.defaultTags.filter(tag => 
            !existingTags.includes(typeof tag === 'string' ? tag.toLowerCase() : tag)
          )`
    );
    
    // 4. Replace in applyDefaultTagsToExistingFiles function
    updatedContent = updatedContent.replace(
      /const existingTags = file\.metadata\.tags \|\| \[\];\s*console\.log\('   Existing tags:', existingTags\);/g,
      `// Convert existing tags to lowercase for comparison
      const existingTagsLower = file.metadata.tags.map(tag => 
        typeof tag === 'string' ? tag.toLowerCase() : tag
      );
      console.log('   Existing tags (lowercase):', existingTagsLower);`
    );
    
    // 5. Update how missing tags are detected in applyDefaultTagsToExistingFiles
    updatedContent = updatedContent.replace(
      /const missingTags = mediaType\.defaultTags\.filter\(tag => !existingTags\.includes\(tag\)\);/g,
      `// Check which default tags are missing (case-insensitive)
      const missingTags = mediaType.defaultTags.filter(tag => {
        const tagLower = typeof tag === 'string' ? tag.toLowerCase() : tag;
        return !existingTagsLower.includes(tagLower);
      });`
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(controllerPath, updatedContent);
    console.log('Successfully patched controller file with case-insensitive comparison');
    
    return true;
  } catch (error) {
    console.error('Error patching controller file:', error);
    return false;
  }
};

// Run the patch
const success = patchControllerFile();
console.log('Patch result:', success ? 'SUCCESS' : 'FAILED');

// Get MongoDB URI from environment variables
const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error('MongoDB URI is not defined in environment variables');
  process.exit(1);
}

// Now fix the database record directly
const fixDatabaseRecord = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected for debugging');
    
    // Fix the file record directly with explicit collection access
    const db = mongoose.connection.db;
    const collection = db.collection('media');
    
    console.log('Got media collection:', collection ? 'Yes' : 'No');
    
    const result = await collection.updateOne(
      { _id: new mongoose.Types.ObjectId('67f54d5ce7a624343173a28f') },
      { 
        $set: { 
          'metadata.tags': ['Product image'],
          'mediaType': '67f54cfce7a624343173a28a' // Ensure media type is stored by ID
        } 
      }
    );
    
    console.log('Database update result:', result);
    
    // Verify the update 
    const doc = await collection.findOne({ _id: new mongoose.Types.ObjectId('67f54d5ce7a624343173a28f') });
    console.log('Updated document:', doc ? {
      id: doc._id.toString(),
      title: doc.title,
      tags: doc.metadata?.tags
    } : 'Not found');
    
    // Disconnect
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    
    return true;
  } catch (error) {
    console.error('Error fixing database record:', error);
    await mongoose.disconnect();
    return false;
  }
};

// Run database fix
if (success) {
  console.log('Starting database fix...');
  fixDatabaseRecord().then(result => {
    console.log('Database fix result:', result ? 'SUCCESS' : 'FAILED');
    console.log('IMPORTANT: You need to restart the backend server for the controller changes to take effect!');
  });
} 