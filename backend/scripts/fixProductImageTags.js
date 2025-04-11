import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MediaType from '../models/MediaType.js';
import Media from '../models/Media.js';

// Load environment variables
dotenv.config();

// Get the MongoDB URI from .env or use a direct connection string
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://theller5567:Noel1124%23%24%23%24%23%24@omniapp.efzkv.mongodb.net/myappdb?retryWrites=true&w=majority&ssl=true';

async function fixProductImageTags() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Find the product image media type
    console.log('Looking for Product Image media type...');
    const productImageType = await MediaType.findOne({ 
      name: { $regex: /product.*image/i }  // Case-insensitive search for "product image"
    });
    
    if (!productImageType) {
      console.log('❌ Product Image media type not found');
      process.exit(1);
    }
    
    console.log('✅ Found Product Image media type:', productImageType.name, 'with ID:', productImageType._id);
    
    // Update with default tags
    if (!productImageType.defaultTags) {
      productImageType.defaultTags = [];
    }
    
    if (!productImageType.defaultTags.includes('Product image')) {
      productImageType.defaultTags.push('Product image');
      await productImageType.save();
      console.log('✅ Added "Product image" default tag to media type');
    } else {
      console.log('✅ Product Image media type already has the default tag');
    }
    
    // Now apply these tags to existing files
    console.log('Finding media files with Product Image media type...');
    const mediaFiles = await Media.find({
      $or: [
        { mediaType: productImageType._id },
        { mediaType: productImageType.name }
      ]
    });
    
    console.log('🔍 Found', mediaFiles.length, 'Product Image media files');
    
    let updatedCount = 0;
    
    for (const file of mediaFiles) {
      // Make sure metadata and tags exist
      if (!file.metadata) {
        file.metadata = {};
      }
      
      if (!file.metadata.tags) {
        file.metadata.tags = [];
      }
      
      // Add the tag if it doesn't exist
      if (!file.metadata.tags.includes('Product image')) {
        file.metadata.tags.push('Product image');
        await file.save();
        console.log(`   ✅ Added tag to file: ${file.title || file._id}`);
        updatedCount++;
      }
    }
    
    console.log('✅ Applied "Product image" tag to', updatedCount, 'out of', mediaFiles.length, 'files');
    console.log('🎉 Fix operation completed successfully');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

// Run the fix function
fixProductImageTags(); 