import express from 'express';
import MediaType from '../models/MediaType.js';
import Media from '../models/Media.js';

const router = express.Router();

// Direct route for fixing Product Image tags
router.get('/fix-product-image-tags', async (req, res) => {
  console.log('🔧 Direct route for fixing Product Image tags');
  
  try {
    // Find the product image media type
    const productImageType = await MediaType.findOne({ 
      name: { $regex: /product.*image/i }  // Case-insensitive search for "product image"
    });
    
    if (!productImageType) {
      console.log('❌ Product Image media type not found');
      return res.status(404).json({ message: 'Product Image media type not found' });
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
    }
    
    // Now apply these tags to existing files
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
        updatedCount++;
      }
    }
    
    console.log('✅ Applied "Product image" tag to', updatedCount, 'files');
    
    res.status(200).json({
      message: 'Successfully updated Product Image media type and files',
      mediaTypeId: productImageType._id,
      mediaTypeName: productImageType.name,
      defaultTags: productImageType.defaultTags,
      totalFiles: mediaFiles.length,
      updatedFiles: updatedCount
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ message: 'Error fixing tags', error: error.message });
  }
});

// Fix tags for a media type by name
router.get('/fix-tags/:mediaTypeName', async (req, res) => {
  try {
    const { mediaTypeName } = req.params;
    console.log('⭐ Manually fixing tags for media type:', mediaTypeName);
    
    // Find the media type 
    const mediaType = await MediaType.findOne({ 
      name: { $regex: new RegExp(mediaTypeName, 'i') } // Case-insensitive search
    });
    
    if (!mediaType) {
      console.log('❌ Media type not found with name:', mediaTypeName);
      return res.status(404).json({ 
        message: 'Media type not found',
        searchedFor: mediaTypeName
      });
    }
    
    console.log('✅ Found media type:', mediaType.name, 'with ID:', mediaType._id);
    console.log('Current default tags:', mediaType.defaultTags);
    
    // Make sure defaultTags exists and update it 
    if (!mediaType.defaultTags || !Array.isArray(mediaType.defaultTags)) {
      mediaType.defaultTags = [];
    }
    
    // Find all media files with this media type
    const mediaFiles = await Media.find({
      $or: [
        { mediaType: mediaType._id.toString() },
        { mediaType: mediaType.name }
      ]
    });
    
    console.log('🔍 Found', mediaFiles.length, 'media files with media type:', mediaType.name);
    
    // Check each file's metadata and tags structure
    const fileStats = {
      totalFiles: mediaFiles.length,
      filesWithNoMetadata: 0,
      filesWithNoTags: 0,
      filesAlreadyTagged: 0,
      filesUpdated: 0,
      errors: 0
    };
    
    for (const file of mediaFiles) {
      console.log('📄 Processing file:', file.title || file._id.toString());
      
      try {
        // Check metadata structure
        if (!file.metadata) {
          console.log('   ⚠️ File has no metadata, creating metadata object');
          file.metadata = {};
          fileStats.filesWithNoMetadata++;
        }
        
        // Check tags structure
        if (!file.metadata.tags || !Array.isArray(file.metadata.tags)) {
          console.log('   ⚠️ File has no tags array, creating tags array');
          file.metadata.tags = [];
          fileStats.filesWithNoTags++;
        }
        
        // Check if the file already has the default tags
        let needsUpdate = false;
        
        for (const tag of mediaType.defaultTags) {
          if (!file.metadata.tags.includes(tag)) {
            console.log(`   ✅ Adding missing tag: "${tag}"`);
            file.metadata.tags.push(tag);
            needsUpdate = true;
          }
        }
        
        if (needsUpdate) {
          await file.save();
          console.log('   ✅ Saved file with updated tags:', file.metadata.tags);
          fileStats.filesUpdated++;
        } else {
          console.log('   ⏭️ File already has all default tags:', file.metadata.tags);
          fileStats.filesAlreadyTagged++;
        }
      } catch (fileError) {
        console.error('   ❌ Error processing file:', fileError);
        fileStats.errors++;
      }
    }
    
    console.log('🎉 Fix operation completed with stats:', fileStats);
    
    res.status(200).json({
      message: 'Fix operation completed',
      mediaType: {
        id: mediaType._id,
        name: mediaType.name,
        defaultTags: mediaType.defaultTags
      },
      stats: fileStats
    });
  } catch (error) {
    console.error('❌ Error in fix operation:', error);
    res.status(500).json({ 
      message: 'Error fixing tags',
      error: error.message
    });
  }
});

export default router; 