import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MediaType from '../models/MediaType.js';
import Media from '../models/Media.js';

// Load environment variables
dotenv.config();

// Get the MongoDB URI from .env or use a direct connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://theller5567:Noel1124%23%24%23%24%23%24@omniapp.efzkv.mongodb.net/myappdb?retryWrites=true&w=majority&ssl=true';

async function ensureAllDefaultTags() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all media types with default tags
    console.log('Finding media types with default tags...');
    const mediaTypes = await MediaType.find({
      defaultTags: { $exists: true, $ne: [] }
    });
    
    console.log(`Found ${mediaTypes.length} media types with default tags:`);
    mediaTypes.forEach(type => {
      console.log(`- ${type.name}: ${type.defaultTags.join(', ')}`);
    });
    
    let totalFilesUpdated = 0;
    let totalFilesProcessed = 0;
    
    // Process each media type
    for (const mediaType of mediaTypes) {
      console.log(`\nChecking files for media type: ${mediaType.name}`);
      
      // Find all media files with this media type
      const mediaFiles = await Media.find({
        $or: [
          { mediaType: mediaType._id },
          { mediaType: mediaType.name }
        ]
      });
      
      console.log(`Found ${mediaFiles.length} files with media type ${mediaType.name}`);
      let filesUpdated = 0;
      
      // Process each file
      for (const file of mediaFiles) {
        totalFilesProcessed++;
        
        // Ensure the file has metadata and tags
        if (!file.metadata) {
          file.metadata = {};
        }
        
        if (!file.metadata.tags || !Array.isArray(file.metadata.tags)) {
          file.metadata.tags = [];
        }
        
        // Check if the file has all the default tags
        let needsUpdate = false;
        
        for (const tag of mediaType.defaultTags) {
          if (!file.metadata.tags.includes(tag)) {
            file.metadata.tags.push(tag);
            needsUpdate = true;
          }
        }
        
        // Save the file if it was updated
        if (needsUpdate) {
          await file.save();
          filesUpdated++;
          totalFilesUpdated++;
          console.log(`  ✅ Updated file: ${file.title || file._id}`);
        }
      }
      
      console.log(`Updated ${filesUpdated} of ${mediaFiles.length} files for ${mediaType.name}`);
    }
    
    console.log(`\n🎉 Completed! Processed ${totalFilesProcessed} files, updated ${totalFilesUpdated} files.`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

// Run the function
ensureAllDefaultTags(); 