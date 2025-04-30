import MediaType from '../models/MediaType.js';
import Media from '../models/Media.js';

// Add a new media type
export const addMediaType = async (req, res) => {
  try {
    console.log('Adding new media type with data:', req.body);
    const { 
      name, 
      fields, 
      acceptedFileTypes, 
      catColor, 
      baseType, 
      includeBaseFields, 
      defaultTags,
      settings 
    } = req.body;
    
    const newMediaType = new MediaType({ 
      name, 
      fields,
      acceptedFileTypes: acceptedFileTypes || [],
      catColor: catColor || '#2196f3',
      baseType: baseType || 'Media',
      includeBaseFields: includeBaseFields !== undefined ? includeBaseFields : true,
      defaultTags: defaultTags || [],
      settings: settings || { allowRelatedMedia: false }
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
  console.log('🔍 API REQUEST: Getting all media types');
  console.log('📄 Request details:', {
    method: req.method,
    url: req.originalUrl,
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      'origin': req.headers['origin']
    }
  });
  
  try {
    const mediaTypes = await MediaType.find().lean();
    console.log(`✅ Found ${mediaTypes.length} media types`);
    
    // Add CORS headers to ensure proper response
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    res.status(200).json(mediaTypes);
  } catch (error) {
    console.error('❌ Error fetching media types:', error);
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
    const { name, fields, acceptedFileTypes, catColor, defaultTags, settings } = req.body;
    
    console.log('Updating media type with data:', { id, requestBody: req.body });
    console.log('Received defaultTags:', defaultTags);
    
    // Find the media type
    const mediaType = await MediaType.findById(id);
    
    if (!mediaType) {
      return res.status(404).json({ message: 'Media type not found' });
    }
    
    console.log('Original media type defaultTags:', mediaType.defaultTags);
    
    // Check if this media type is in use
    const count = await Media.countDocuments({
      $or: [
        { mediaType: id },
        { mediaType: mediaType.name }
      ]
    });
    
    // We always allow updating defaultTags
    if (defaultTags !== undefined) {
      console.log('Setting defaultTags from', mediaType.defaultTags, 'to', defaultTags);
      mediaType.defaultTags = defaultTags;
    } else {
      console.log('defaultTags not provided in request');
    }
    
    // We also always allow updating settings
    if (settings !== undefined) {
      console.log('Setting settings from', mediaType.settings, 'to', settings);
      if (typeof settings === 'object') {
        // Initialize settings if it doesn't exist
        if (!mediaType.settings) {
          mediaType.settings = {};
        }
        
        // Update specific settings fields
        Object.keys(settings).forEach(key => {
          mediaType.settings[key] = settings[key];
        });
        
        console.log('Updated settings:', mediaType.settings);
      } else {
        console.log('Warning: settings is not an object:', settings);
      }
    } else {
      console.log('settings not provided in request');
    }
    
    if (count > 0) {
      // For media types in use, we can only update acceptedFileTypes, catColor, defaultTags, and settings
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
      
      if (updated || defaultTags !== undefined || settings !== undefined) {
        const savedMediaType = await mediaType.save();
        
        console.log('Updated media type in use:', {
          id,
          name: mediaType.name,
          defaultTags: savedMediaType.defaultTags,
          settings: savedMediaType.settings
        });
        
        // Log the final media type data that will be sent to client
        const responseData = {
          ...savedMediaType._doc,
          usageCount: count,
          warningMessage: "Only acceptedFileTypes, catColor, defaultTags, and settings were updated as this media type is in use by existing files"
        };
        console.log('Response data (in use case):', JSON.stringify(responseData, null, 2));
        
        return res.status(200).json(responseData);
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
    
    console.log('Before saving non-used media type, defaultTags:', mediaType.defaultTags);
    const savedMediaType = await mediaType.save();
    console.log('After saving non-used media type, defaultTags:', savedMediaType.defaultTags);
    
    console.log('Updated media type:', {
      id,
      name: savedMediaType.name,
      defaultTags: savedMediaType.defaultTags,
      settings: savedMediaType.settings
    });
    
    // Log the final media type data that will be sent to client
    const responseData = {
      ...savedMediaType._doc,
      usageCount: count
    };
    console.log('Response data:', JSON.stringify(responseData, null, 2));
    
    res.status(200).json(responseData);
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
    let fileUpdateResults = [];
    
    console.log('🔄 Starting to update media files with default tags');
    
    for (const file of mediaFiles) {
      console.log('📄 Processing file:', file.title || file.id, 'Current metadata:', file.metadata);
      
      // Ensure the metadata object exists
      if (!file.metadata) {
        file.metadata = { tags: [] };
      }
      
      // Ensure the tags array exists
      if (!file.metadata.tags) {
        file.metadata.tags = [];
      }
      
      // Convert existing tags to lowercase for comparison
      const existingTagsLower = file.metadata.tags.map(tag => 
        typeof tag === 'string' ? tag.toLowerCase() : tag
      );
      console.log('   Existing tags (lowercase):', existingTagsLower);
      
      // Check which default tags are missing (case-insensitive)
      const missingTags = mediaType.defaultTags.filter(tag => {
        const tagLower = typeof tag === 'string' ? tag.toLowerCase() : tag;
        return !existingTagsLower.includes(tagLower);
      });
      
      // Only add the missing tags in their original case
      const newTags = [...file.metadata.tags];
      let tagsAdded = false;
      
      for (const tag of missingTags) {
        newTags.push(tag);
        tagsAdded = true;
      }
      
      console.log('   New tags after merge:', newTags);
      
      // Only update if there are new tags to add
      if (tagsAdded) {
        console.log('   ✅ Adding missing tags:', missingTags);
        
        // Update the tags
        file.metadata.tags = newTags;
        
        try {
          const savedFile = await file.save();
          console.log('   ✅ Successfully saved file with new tags:', savedFile.metadata.tags);
          updatedCount++;
          
          fileUpdateResults.push({
            id: file._id,
            title: file.title || 'No title',
            addedTags: missingTags,
            newTagsTotal: newTags.length
          });
        } catch (saveError) {
          console.error('   ❌ Error saving file:', saveError);
        }
      } else {
        console.log('   ⏭️ File already has all default tags, skipping');
      }
    }
    
    console.log('🎉 Successfully updated', updatedCount, 'out of', mediaFiles.length, 'files');
    
    // Add cache busting header to prevent browser caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.status(200).json({ 
      message: `Default tags applied to ${updatedCount} media files`, 
      tagsApplied: mediaType.defaultTags,
      count: updatedCount,
      totalFiles: mediaFiles.length,
      updatedFiles: fileUpdateResults
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
      // Ensure we're working with an array of tags, converting to lowercase for case-insensitive comparison
      const existingTags = Array.isArray(file.metadata?.tags) 
        ? file.metadata.tags.map(tag => typeof tag === 'string' ? tag.toLowerCase() : tag)
        : [];
      
      // Convert default tags to lowercase for case-insensitive comparison
      const defaultTagsLower = mediaType.defaultTags.map(tag => 
        typeof tag === 'string' ? tag.toLowerCase() : tag
      );
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

// Check files needing default tags
export const getFilesNeedingTags = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('⭐ Checking files needing default tags for media type ID:', id);
    
    // Find the media type to get its default tags
    const mediaType = await MediaType.findById(id);
    
    if (!mediaType) {
      console.log('❌ Media type not found with ID:', id);
      return res.status(404).json({ message: 'Media type not found' });
    }
    
    console.log('📋 Media type found:', mediaType.name, 'with ID:', mediaType._id);
    console.log('🏷️ Default tags:', mediaType.defaultTags);
    
    if (!mediaType.defaultTags || mediaType.defaultTags.length === 0) {
      console.log('⚠️ No default tags defined for this media type');
      return res.status(200).json({ count: 0 });
    }
    
    // Find all media files with this media type
    const mediaFiles = await Media.find({
      $or: [
        { mediaType: id },
        { mediaType: mediaType.name }
      ]
    }).lean();
    
    console.log('🔍 Found', mediaFiles.length, 'media files with media type:', mediaType.name);
    console.log('DEBUG - Media file raw data:', JSON.stringify(mediaFiles, null, 2));
    
    if (mediaFiles.length === 0) {
      return res.status(200).json({ count: 0 });
    }
    
    // Count files that need tags (missing one or more default tags)
    let filesNeedingTags = 0;
    let filesWithIssues = [];
    
    for (const file of mediaFiles) {
      console.log('DEBUG - Processing file:', file.title);
      console.log('DEBUG - File metadata:', JSON.stringify(file.metadata, null, 2));
      
      // Ensure we're working with an array of tags, converting to lowercase for case-insensitive comparison
      const existingTags = Array.isArray(file.metadata?.tags) 
        ? file.metadata.tags.map(tag => typeof tag === 'string' ? tag.toLowerCase() : tag)
        : [];
      
      console.log('DEBUG - Existing tags converted to lowercase:', existingTags);
      
      // Convert default tags to lowercase for case-insensitive comparison
      const defaultTagsLower = mediaType.defaultTags.map(tag => 
        typeof tag === 'string' ? tag.toLowerCase() : tag
      );
      
      console.log('DEBUG - Default tags converted to lowercase:', defaultTagsLower);
      
      // Check if any default tag is missing using case-insensitive comparison
      const missingTags = defaultTagsLower.filter(defaultTag => 
        !existingTags.includes(defaultTag)
      );
      
      console.log('DEBUG - Missing tags:', missingTags);
      
      const needsUpdate = missingTags.length > 0;
      
      console.log('DEBUG - Needs update:', needsUpdate);
      
      if (needsUpdate) {
        console.log(`File "${file.title || file._id}" needs tags. Existing tags:`, file.metadata?.tags);
        filesNeedingTags++;
        filesWithIssues.push({
          id: file._id,
          title: file.title || 'No title',
          existingTags: file.metadata?.tags || [],
          missingTags: mediaType.defaultTags.filter(tag => 
            !existingTags.includes(tag.toLowerCase())
          )
        });
      }
    }
    
    console.log('🔍 Found', filesNeedingTags, 'files needing default tags for media type:', mediaType.name);
    if (filesNeedingTags > 0) {
      console.log('📄 Files with issues:', JSON.stringify(filesWithIssues, null, 2));
    }
    
    // Note: Cache control headers are now handled by the CORS middleware
    
    return res.status(200).json({ 
      count: filesNeedingTags,
      filesWithIssues: filesNeedingTags > 0 ? filesWithIssues : [] 
    });
  } catch (error) {
    console.error('❌ Error checking files needing tags:', error);
    res.status(500).json({ message: 'Error checking files needing tags', error });
  }
};

// Fix a specific media file's tags
export const fixSpecificMediaFile = async (req, res) => {
  try {
    const { mediaTypeId, fileId } = req.params;
    
    console.log('⭐ Fixing specific media file:', fileId, 'for media type:', mediaTypeId);
    
    // Find the media type
    const mediaType = await MediaType.findById(mediaTypeId);
    if (!mediaType) {
      console.log('❌ Media type not found with ID:', mediaTypeId);
      return res.status(404).json({ message: 'Media type not found' });
    }
    
    console.log('📋 Media type found:', mediaType.name, 'with ID:', mediaType._id);
    console.log('🏷️ Default tags:', mediaType.defaultTags);
    
    if (!mediaType.defaultTags || mediaType.defaultTags.length === 0) {
      console.log('⚠️ No default tags defined for this media type');
      return res.status(400).json({ message: 'No default tags to apply' });
    }
    
    // Find the specific file
    const file = await Media.findById(fileId);
    if (!file) {
      console.log('❌ Media file not found with ID:', fileId);
      return res.status(404).json({ message: 'Media file not found' });
    }
    
    console.log('📄 Found file:', file.title || file._id.toString());
    console.log('   Current state:', JSON.stringify({
      hasMetadata: !!file.metadata,
      tags: file.metadata?.tags || [],
      mediaType: file.mediaType
    }, null, 2));
    
    // Ensure metadata exists
    if (!file.metadata) {
      file.metadata = {};
    }
    
    // Save the old tags for reporting
    const oldTags = [...(file.metadata.tags || [])];
    
    // Completely reset the file's metadata.tags with the default tags
    // This ensures we're using the exact same strings as the default tags
    file.metadata.tags = [...mediaType.defaultTags];
    
    try {
      // Force save to update in database
      await Media.updateOne(
        { _id: fileId },
        { $set: { 'metadata.tags': mediaType.defaultTags } }
      );
      
      // Also save using the model to trigger any middleware
      await file.save();
      
      console.log('✅ Successfully reset file tags. Old:', oldTags, 'New:', file.metadata.tags);
      
      // Add cache busting header to prevent browser caching
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      return res.status(200).json({
        message: 'Successfully fixed media file tags',
        file: {
          id: file._id,
          title: file.title || 'Untitled',
          oldTags,
          newTags: file.metadata.tags
        }
      });
    } catch (saveError) {
      console.error('❌ Error saving file:', saveError);
      return res.status(500).json({ message: 'Error saving file', error: saveError.message });
    }
  } catch (error) {
    console.error('❌ Error fixing specific media file:', error);
    return res.status(500).json({ message: 'Error fixing specific media file', error: error.message });
  }
};

// Get a summary of files needing tags across all media types
export const getFilesNeedingTagsSummary = async (req, res) => {
  // Set a timeout for this potentially resource-intensive operation
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Operation timed out after 30 seconds'));
    }, 30000); // 30 second timeout
  });
  
  try {
    console.log('⭐ Checking files needing default tags across all media types');
    
    // Find all active media types (not archived or deprecated)
    const mediaTypes = await MediaType.find({
      status: { $nin: ['archived', 'deprecated'] }
    }).lean();
    
    console.log(`📋 Found ${mediaTypes.length} active media types`);
    
    // Initialize results object
    const results = {
      totalMediaTypes: mediaTypes.length,
      totalFilesNeedingTags: 0,
      mediaTypes: []
    };
    
    // Process each media type with timeout protection
    const processMediaTypes = async () => {
      for (const mediaType of mediaTypes) {
        try {
          console.log(`🔍 Processing media type: ${mediaType.name}`);
          
          // Skip media types without default tags
          if (!mediaType.defaultTags || mediaType.defaultTags.length === 0) {
            console.log(`⏭️ Skipping ${mediaType.name} - no default tags`);
            results.mediaTypes.push({
              id: mediaType._id,
              name: mediaType.name,
              count: 0,
              hasDefaultTags: false,
              filesWithIssues: []
            });
            continue;
          }
          
          // Find all media files with this media type
          const mediaFiles = await Media.find({
            $or: [
              { mediaType: mediaType._id },
              { mediaType: mediaType.name }
            ]
          }).lean();
          
          if (mediaFiles.length === 0) {
            console.log(`⏭️ No files found for media type: ${mediaType.name}`);
            results.mediaTypes.push({
              id: mediaType._id,
              name: mediaType.name,
              count: 0,
              hasDefaultTags: true,
              defaultTags: mediaType.defaultTags,
              filesWithIssues: []
            });
            continue;
          }
          
          // Count files that need tags (missing one or more default tags)
          let filesNeedingTags = 0;
          let filesWithIssues = [];
          
          // Convert default tags to lowercase for case-insensitive comparison
          const defaultTagsLower = mediaType.defaultTags.map(tag => 
            typeof tag === 'string' ? tag.toLowerCase() : tag
          );
          
          for (const file of mediaFiles) {
            // Ensure we're working with an array of tags, converting to lowercase for case-insensitive comparison
            const existingTags = Array.isArray(file.metadata?.tags) 
              ? file.metadata.tags.map(tag => typeof tag === 'string' ? tag.toLowerCase() : tag)
              : [];
            
            // Check if any default tag is missing using case-insensitive comparison
            const missingTags = defaultTagsLower.filter(defaultTag => 
              !existingTags.includes(defaultTag)
            );
            
            const needsUpdate = missingTags.length > 0;
            
            if (needsUpdate) {
              filesNeedingTags++;
              filesWithIssues.push({
                id: file._id,
                title: file.title || 'No title',
                existingTags: file.metadata?.tags || [],
                missingTags: mediaType.defaultTags.filter(tag => 
                  !existingTags.includes(tag.toLowerCase())
                )
              });
            }
          }
          
          console.log(`✅ ${mediaType.name}: ${filesNeedingTags} out of ${mediaFiles.length} files need tags`);
          
          // Add to results
          results.mediaTypes.push({
            id: mediaType._id,
            name: mediaType.name,
            count: filesNeedingTags,
            totalFiles: mediaFiles.length,
            hasDefaultTags: true,
            defaultTags: mediaType.defaultTags,
            // Only include the first 50 files with issues to keep the response size reasonable
            filesWithIssues: filesNeedingTags > 0 ? filesWithIssues.slice(0, 50) : [],
            // If we truncated the list, include the total count
            filesWithIssuesTruncated: filesWithIssues.length > 50,
            filesWithIssuesTotal: filesWithIssues.length
          });
          
          // Add to total count
          results.totalFilesNeedingTags += filesNeedingTags;
        } catch (mediaTypeError) {
          console.error(`❌ Error processing media type ${mediaType.name}:`, mediaTypeError);
          
          // Add error information to results but continue processing other media types
          results.mediaTypes.push({
            id: mediaType._id,
            name: mediaType.name,
            error: mediaTypeError.message || 'Unknown error',
            hasError: true
          });
        }
      }
      
      return results;
    };
    
    // Execute with timeout protection
    const processedResults = await Promise.race([
      processMediaTypes(),
      timeoutPromise
    ]);
    
    console.log(`🎉 Total files needing tags across all media types: ${results.totalFilesNeedingTags}`);
    
    // Add cache busting headers to prevent browser caching (same as the middleware for the single endpoint)
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    
    // Add performance metrics to the response
    results.performanceMetrics = {
      mediaTypesProcessed: results.mediaTypes.length,
      executionTimeMs: Date.now() - req._startTime || 0,
      mediaTypesWithErrors: results.mediaTypes.filter(mt => mt.hasError).length
    };
    
    return res.status(200).json(results);
  } catch (error) {
    console.error('❌ Error generating files needing tags summary:', error);
    
    // Check if this is a timeout error
    if (error.message && error.message.includes('timed out')) {
      return res.status(503).json({ 
        message: 'The operation timed out. The system may be under heavy load or there are too many files to process.',
        error: error.message
      });
    }
    
    res.status(500).json({ message: 'Error generating files needing tags summary', error: error.message });
  }
};
