import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const updateWebinarVideo = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/omni');
    console.log('Connected to MongoDB');
    
    // Get the ID from the screenshot
    const id = '67f52f170c779312e0b9eddd';
    
    // Update the Webinar Video media type using the exact ID from the screenshot
    const result = await mongoose.connection.collection('mediatypes').updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: { 
        acceptedFileTypes: [
          'video/mp4',
          'video/webm',
          'video/ogg',
          'video/quicktime',
          'video/*'
        ]
      }}
    );
    
    console.log('Update result:', result);
    
    // Verify the update
    const updatedMediaType = await mongoose.connection.collection('mediatypes').findOne({ 
      _id: new mongoose.Types.ObjectId(id)
    });
    
    console.log('Updated Webinar Video media type:', JSON.stringify(updatedMediaType, null, 2));
    
  } catch (error) {
    console.error('Error updating Webinar Video media type:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

updateWebinarVideo(); 