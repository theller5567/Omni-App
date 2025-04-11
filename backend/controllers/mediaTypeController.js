import MediaType from '../models/MediaType.js';
import Media from '../models/Media.js';

// Add a new media type
export const addMediaType = async (req, res) => {
  try {
    console.log('Adding new media type with data:', req.body);
    const { name, fields, acceptedFileTypes, catColor, baseType, includeBaseFields, defaultTags } = req.body;
    const newMediaType = new MediaType({ 
      name, 
      fields,
      acceptedFileTypes: acceptedFileTypes || [],
      catColor: catColor || '#2196f3',
      baseType: baseType || 'Media',
      includeBaseFields: includeBaseFields !== undefined ? includeBaseFields : true,
      defaultTags: defaultTags || []
    });
    
    const savedType = await newMediaType.save();
    console.log('Saved new media type with defaultTags:', savedType.defaultTags);
    
    res.status(201).json(savedType);
  } catch (error) {
    console.error('Error adding media type:', error);
    res.status(400).json({ message: 'Error adding media type', error });
  }
};

// Get all media types
export const getMediaTypes = async (req, res) => {
    console.log('Getting media types', req.body);
  try {
    const mediaTypes = await MediaType.find().lean();
    console.log('Found media types:', mediaTypes);
    res.status(200).json(mediaTypes);
  } catch (error) {
    console.error('Error fetching media types:', error);
    res.status(500).json({ message: 'Error fetching media types', error });
  }
};

// Check usage of a media type
export const checkMediaTypeUsage = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the media type to get its name
    const mediaType = await MediaType.findById(id);
    
    if (!mediaType) {
      return res.status(404).json({ message: 'Media type not found' });
    }
    
    // Count how many media files use this type by either ID or name
    const count = await Media.countDocuments({
      $or: [
        { mediaType: id },
        { mediaType: mediaType.name }
      ]
    });
    
    // Update the usage count in the media type
    await MediaType.findByIdAndUpdate(id, { usageCount: count });
    
    res.status(200).json({ count, id });
  } catch (error) {
    console.error('Error checking media type usage:', error);
    res.status(500).json({ message: 'Error checking media type usage', error });
  }
};

// Deprecate a media type (soft delete)
export const deprecateMediaType = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the media type
    const mediaType = await MediaType.findById(id);
    
    if (!mediaType) {
      return res.status(404).json({ message: 'Media type not found' });
    }
    
    // Mark as deprecated
    mediaType.status = 'deprecated';
    await mediaType.save();
    
    res.status(200).json(mediaType);
  } catch (error) {
    console.error('Error deprecating media type:', error);
    res.status(500).json({ message: 'Error deprecating media type', error });
  }
};

// Archive a media type (complete soft delete)
export const archiveMediaType = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the media type
    const mediaType = await MediaType.findById(id);
    
    if (!mediaType) {
      return res.status(404).json({ message: 'Media type not found' });
    }
    
    // Check if there are any media files using this type (for informational purposes only)
    const count = await Media.countDocuments({
      $or: [
        { mediaType: id },
        { mediaType: mediaType.name }
      ]
    });
    
    // Mark as archived - we now allow archiving even if media files are using this type
    mediaType.status = 'archived';
    await mediaType.save();
    
    res.status(200).json({
      ...mediaType._doc,
      usageCount: count
    });
  } catch (error) {
    console.error('Error archiving media type:', error);
    res.status(500).json({ message: 'Error archiving media type', error });
  }
};

// Migrate media files from one type to another
export const migrateMediaFiles = async (req, res) => {
  try {
    const { sourceId, targetId } = req.body;
    
    if (sourceId === targetId) {
      return res.status(400).json({ message: 'Source and target media types cannot be the same' });
    }
    
    // Get both media types
    const sourceType = await MediaType.findById(sourceId);
    const targetType = await MediaType.findById(targetId);
    
    if (!sourceType || !targetType) {
      return res.status(404).json({ message: 'One or both media types not found' });
    }
    
    // Get all media files of the source type (check both ID and name references)
    const mediaFiles = await Media.find({
      $or: [
        { mediaType: sourceId },
        { mediaType: sourceType.name }
      ]
    });
    
    console.log(`Migrating ${mediaFiles.length} files from ${sourceType.name} to ${targetType.name}`);
    
    // Update all media files to use the target type
    for (const file of mediaFiles) {
      // Always use the target ID for consistency
      file.mediaType = targetId;
      
      // Preserve existing metadata during migration
      // Additional logic could be added here to transform metadata based on the target type's fields
      
      await file.save();
    }
    
    // Update usage counts
    sourceType.usageCount = 0;
    targetType.usageCount = await Media.countDocuments({
      $or: [
        { mediaType: targetId },
        { mediaType: targetType.name }
      ]
    });
    
    // Mark source as replaced by target
    sourceType.replacedBy = targetId;
    
    await sourceType.save();
    await targetType.save();
    
    res.status(200).json({
      message: `Successfully migrated ${mediaFiles.length} files`,
      source: sourceType,
      target: targetType
    });
  } catch (error) {
    console.error('Error migrating media files:', error);
    res.status(500).json({ message: 'Error migrating media files', error });
  }
};

// Permanently delete a media type (only if not in use)
export const deleteMediaType = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('⭐ DELETE REQUEST RECEIVED for media type ID:', id);
    
    // Log the collection information
    console.log('📚 MediaType model info:');
    console.log('- Collection name:', MediaType.collection.name);
    console.log('- Model name:', MediaType.modelName);
    
    // Find the media type
    const mediaType = await MediaType.findById(id);
    
    if (!mediaType) {
      console.log('❌ Media type not found for ID:', id);
      return res.status(404).json({ message: 'Media type not found' });
    }
    
    console.log('✅ Found media type to delete:', mediaType.name, 'with ID:', mediaType._id.toString());
    
    // Check if there are any media files using this type
    const count = await Media.countDocuments({
      $or: [
        { mediaType: id },
        { mediaType: mediaType.name }
      ]
    });
    
    console.log('ℹ️ Count of media files using this type:', count);
    
    if (count > 0) {
      console.log('❌ Cannot delete media type that is still in use, found', count, 'media files using it');
      return res.status(400).json({ 
        message: 'Cannot delete media type that is still in use',
        count
      });
    }
    
    // If no files are using it, permanently delete it
    console.log('🗑️ Attempting to delete media type from database...');
    
    // Try direct deletion to see if it works better
    const directDeleteResult = await MediaType.deleteOne({ _id: id });
    console.log('🧹 Direct deleteOne result:', directDeleteResult);
    
    if (directDeleteResult.deletedCount === 0) {
      console.log('⚠️ deleteOne did not delete any document');
    }
    
    // Also try the findByIdAndDelete method
    const deleteResult = await MediaType.findByIdAndDelete(id);
    
    if (!deleteResult) {
      console.log('❌ Failed to delete media type with findByIdAndDelete, no document returned');
      // Don't return here, we already tried direct deletion
    } else {
      console.log('✅ Successfully deleted media type with findByIdAndDelete:', deleteResult._id.toString());
    }
    
    // Try a find after deletion to confirm it's gone
    const checkAfterDelete = await MediaType.findById(id);
    console.log('🔍 Media type after deletion attempt:', checkAfterDelete);
    
    res.status(200).json({ 
      message: 'Media type permanently deleted',
      id,
      deleteResultCount: directDeleteResult.deletedCount,
      stillExists: !!checkAfterDelete
    });
  } catch (error) {
    console.error('❌ Error deleting media type:', error);
    res.status(500).json({ message: 'Error deleting media type', error });
  }
};

// Update a media type
export const updateMediaType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, fields, acceptedFileTypes, catColor, defaultTags } = req.body;
    
    console.log('Updating media type with data:', { id, requestBody: req.body });
    
    // Find the media type
    const mediaType = await MediaType.findById(id);
    
    if (!mediaType) {
      return res.status(404).json({ message: 'Media type not found' });
    }
    
    // Check if this media type is in use
    const count = await Media.countDocuments({
      $or: [
        { mediaType: id },
        { mediaType: mediaType.name }
      ]
    });
    
    // We always allow updating defaultTags
    if (defaultTags) {
      mediaType.defaultTags = defaultTags;
    }
    
    if (count > 0) {
      // For media types in use, we can only update acceptedFileTypes, catColor, and defaultTags
      // Cannot change fields or name as it could break existing media files
      let updated = false;
      
      if (acceptedFileTypes) {
        mediaType.acceptedFileTypes = acceptedFileTypes;
        updated = true;
      }
      
      if (catColor) {
        mediaType.catColor = catColor;
        updated = true;
      }
      
      if (updated || defaultTags) {
        await mediaType.save();
        
        console.log('Updated media type in use:', {
          id,
          name: mediaType.name,
          defaultTags: mediaType.defaultTags
        });
        
        return res.status(200).json({
          ...mediaType._doc,
          usageCount: count,
          warningMessage: "Only acceptedFileTypes, catColor, and defaultTags were updated as this media type is in use by existing files"
        });
      } else {
        return res.status(400).json({ 
          message: 'Cannot modify fields or name of a media type that is in use by existing files',
          count
        });
      }
    }
    
    // If not in use, we can update everything
    if (name) mediaType.name = name;
    if (fields) mediaType.fields = fields;
    if (acceptedFileTypes) mediaType.acceptedFileTypes = acceptedFileTypes;
    if (catColor) mediaType.catColor = catColor;
    
    await mediaType.save();
    
    console.log('Updated media type:', {
      id,
      name: mediaType.name,
      defaultTags: mediaType.defaultTags
    });
    
    res.status(200).json({
      ...mediaType._doc,
      usageCount: count
    });
  } catch (error) {
    console.error('Error updating media type:', error);
    res.status(500).json({ message: 'Error updating media type', error });
  }
};

// Apply default tags to existing media files
export const applyDefaultTagsToExistingFiles = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('⭐ Applying default tags to media files for media type ID:', id);
    
    // Find the media type to get its default tags
    const mediaType = await MediaType.findById(id);
    
    if (!mediaType) {
      console.log('❌ Media type not found with ID:', id);
      return res.status(404).json({ message: 'Media type not found' });
    }
    
    console.log('📋 Media type found:', mediaType.name, 'with ID:', mediaType._id);
    console.log('🏷️ Default tags:', mediaType.defaultTags);
    
    if (!mediaType.defaultTags || mediaType.defaultTags.length === 0) {
      console.log('⚠️ No default tags to apply for this media type');
      return res.status(400).json({ message: 'No default tags to apply' });
    }
    
    // Find all media files with this media type
    const mediaFiles = await Media.find({
      $or: [
        { mediaType: id },
        { mediaType: mediaType.name }
      ]
    });
    
    console.log('🔍 Found', mediaFiles.length, 'media files with media type:', mediaType.name);
    
    if (mediaFiles.length === 0) {
      return res.status(200).json({ message: 'No media files found with this media type', count: 0 });
    }
    
    // Update each media file by adding default tags if they don't already have them
    let updatedCount = 0;
    
    console.log('🔄 Starting to update media files with default tags');
    
    for (const file of mediaFiles) {
      console.log('📄 Processing file:', file.title || file.id, 'Current metadata:', file.metadata);
      
      const existingTags = file.metadata?.tags || [];
      console.log('   Existing tags:', existingTags);
      
      // Create a new array with all tags, removing duplicates
      const newTags = [...new Set([...existingTags, ...mediaType.defaultTags])];
      console.log('   New tags after merge:', newTags);
      
      // Only update if there are new tags to add
      if (newTags.length > existingTags.length) {
        console.log('   ✅ Adding new tags to file');
        
        // Initialize metadata object if it doesn't exist
        if (!file.metadata) {
          file.metadata = { tags: [] };
        }
        
        // Ensure the tags property exists
        if (!file.metadata.tags) {
          file.metadata.tags = [];
        }
        
        file.metadata.tags = newTags;
        
        try {
          await file.save();
          console.log('   ✅ Successfully saved file with new tags');
          updatedCount++;
        } catch (saveError) {
          console.error('   ❌ Error saving file:', saveError);
        }
      } else {
        console.log('   ⏭️ File already has all default tags, skipping');
      }
    }
    
    console.log('🎉 Successfully updated', updatedCount, 'out of', mediaFiles.length, 'files');
    
    res.status(200).json({ 
      message: `Default tags applied to ${updatedCount} media files`, 
      tagsApplied: mediaType.defaultTags,
      count: updatedCount,
      totalFiles: mediaFiles.length 
    });
  } catch (error) {
    console.error('❌ Error applying default tags:', error);
    res.status(500).json({ message: 'Error applying default tags', error });
  }
};

// Get a specific media type by ID
export const getMediaTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const mediaType = await MediaType.findById(id);
    
    if (!mediaType) {
      return res.status(404).json({ message: 'Media type not found' });
    }
    
    res.status(200).json(mediaType);
  } catch (error) {
    console.error('Error fetching media type:', error);
    res.status(500).json({ message: 'Error fetching media type', error });
  }
};

// Debug endpoint to examine media type in detail
export const debugMediaType = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 Debug request for media type ID:', id);
    
    // Find the media type
    const mediaType = await MediaType.findById(id);
    
    if (!mediaType) {
      console.log('❌ Media type not found');
      return res.status(404).json({ message: 'Media type not found' });
    }
    
    // Get schema info
    const schemaKeys = Object.keys(MediaType.schema.paths);
    const schemaDetails = {};
    
    schemaKeys.forEach(key => {
      const path = MediaType.schema.paths[key];
      schemaDetails[key] = {
        type: path.instance,
        required: !!path.isRequired,
        default: path.defaultValue,
        options: path.enumValues
      };
    });
    
    // Get a list of all fields in the document
    const documentKeys = Object.keys(mediaType._doc);
    
    // Get a sample media file that uses this media type
    const sampleMediaFile = await Media.findOne({
      $or: [
        { mediaType: id },
        { mediaType: mediaType.name }
      ]
    });
    
    const debugInfo = {
      id: mediaType._id,
      name: mediaType.name,
      // Full document
      document: mediaType._doc,
      // Schema information
      schema: {
        keys: schemaKeys,
        details: schemaDetails
      },
      // Document keys
      documentKeys,
      // Default tags specific debugging
      defaultTags: {
        value: mediaType.defaultTags,
        type: typeof mediaType.defaultTags,
        isArray: Array.isArray(mediaType.defaultTags),
        length: mediaType.defaultTags ? mediaType.defaultTags.length : null
      },
      // Sample media file
      sampleMediaFile: sampleMediaFile ? {
        id: sampleMediaFile._id,
        title: sampleMediaFile.title,
        mediaType: sampleMediaFile.mediaType,
        metadata: sampleMediaFile.metadata,
        tags: sampleMediaFile.metadata?.tags
      } : null
    };
    
    res.status(200).json(debugInfo);
  } catch (error) {
    console.error('❌ Error in debug endpoint:', error);
    res.status(500).json({ message: 'Error debugging media type', error });
  }
};

// Utility endpoint to set default tags for Product Image media type
export const setProductImageDefaultTags = async (req, res) => {
  try {
    console.log('🔧 Setting default tags for Product Image media type');
    
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
    productImageType.defaultTags = ['Product image'];
    await productImageType.save();
    
    console.log('✅ Successfully set default tags for Product Image media type:', productImageType.defaultTags);
    
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
      const existingTags = file.metadata?.tags || [];
      const newTags = [...new Set([...existingTags, 'Product image'])];
      
      if (newTags.length > existingTags.length) {
        if (!file.metadata) {
          file.metadata = { tags: ['Product image'] };
        } else {
          file.metadata.tags = newTags;
        }
        
        await file.save();
        updatedCount++;
      }
    }
    
    console.log('✅ Applied "Product image" tag to', updatedCount, 'out of', mediaFiles.length, 'files');
    
    res.status(200).json({
      message: 'Successfully updated Product Image media type and files',
      mediaTypeId: productImageType._id,
      defaultTags: productImageType.defaultTags,
      updatedFiles: updatedCount,
      totalFiles: mediaFiles.length
    });
  } catch (error) {
    console.error('❌ Error in utility endpoint:', error);
    res.status(500).json({ message: 'Error updating Product Image media type', error });
  }
};
