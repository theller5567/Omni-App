import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const createVideoMediaType = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/omni');
    console.log('Connected to MongoDB');
    
    // First check if it already exists
    const existing = await mongoose.connection.collection('mediatypes').findOne({ 
      name: { $in: ['Webinar Video', 'Video'] }
    });
    
    if (existing) {
      console.log(`Media type already exists: ${existing.name}`);
      console.log('Updating the existing media type with video file types');
      
      const result = await mongoose.connection.collection('mediatypes').updateOne(
        { _id: existing._id },
        { $set: { acceptedFileTypes: [
          'video/mp4',
          'video/webm',
          'video/ogg',
          'video/quicktime'
        ]}}
      );
      
      console.log('Update result:', result);
      return;
    }
    
    // Create a new media type for videos
    const newVideoMediaType = {
      name: 'Video',
      fields: [
        {
          name: 'Title',
          type: 'Text',
          options: [],
          required: true
        },
        {
          name: 'Description',
          type: 'Text',
          options: [],
          required: true
        },
        {
          name: 'Duration',
          type: 'Number',
          options: [],
          required: true
        },
        {
          name: 'VideoType',
          type: 'Select',
          options: ['Webinar', 'Tutorial', 'Promotional', 'Interview', 'Other'],
          required: true
        }
      ],
      status: 'active',
      usageCount: 0,
      replacedBy: null,
      isDeleting: false,
      acceptedFileTypes: [
        'video/mp4',
        'video/webm',
        'video/ogg',
        'video/quicktime'
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await mongoose.connection.collection('mediatypes').insertOne(newVideoMediaType);
    console.log('New video media type created:', result);
    
  } catch (error) {
    console.error('Error creating video media type:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

createVideoMediaType(); 