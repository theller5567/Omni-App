import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const updateMediaType = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/omni');
    console.log('Connected to MongoDB');
    
    // List all media types first
    const mediaTypes = await mongoose.connection.collection('mediatypes').find().toArray();
    console.log('Available media types:');
    mediaTypes.forEach(type => {
      console.log(`- ID: ${type._id}, Name: "${type.name}"`);
    });
    
    // Find the media type by name
    const mediaType = await mongoose.connection.collection('mediatypes').findOne({ name: 'Webinar Video' });
    
    if (!mediaType) {
      console.log('Media type "Webinar Video" not found');
      return;
    }
    
    console.log('Found media type:', mediaType);
    
    // Update the acceptedFileTypes
    const result = await mongoose.connection.collection('mediatypes').updateOne(
      { name: 'Webinar Video' },
      { $set: { acceptedFileTypes: [
        'video/mp4',
        'video/webm',
        'video/ogg',
        'video/quicktime'
      ]}}
    );
    
    console.log('Update result:', result);
    console.log('Media type updated successfully with video file types');
  } catch (error) {
    console.error('Error updating media type:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

updateMediaType(); 