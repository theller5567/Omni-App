import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const createWebinarVideo = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/omni');
    console.log('Connected to MongoDB');
    
    // Create the Webinar Video media type to match the screenshot
    const webinarVideoMediaType = {
      name: 'Webinar Video',
      fields: [
        {
          name: 'Webinar Title',
          type: 'Text',
          options: [],
          required: true
        },
        {
          name: 'Webinar Summary',
          type: 'Text',
          options: [],
          required: true
        },
        {
          name: 'Webinar CTA',
          type: 'Text',
          options: [],
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
        'video/quicktime',
        'video/*'
      ],
      createdAt: new Date("2025-04-08T14:13:43.254Z"),
      updatedAt: new Date("2025-04-08T14:13:43.254Z")
    };
    
    // Force the ID to match what was in the screenshot
    try {
      webinarVideoMediaType._id = new mongoose.Types.ObjectId("67f52f170c779312e0b9eddd");
    } catch (error) {
      console.error('Error setting ID:', error);
    }
    
    // Check if it already exists
    const existing = await mongoose.connection.collection('mediatypes').findOne({ 
      name: 'Webinar Video'
    });
    
    if (existing) {
      console.log('Webinar Video already exists, updating it');
      const result = await mongoose.connection.collection('mediatypes').updateOne(
        { _id: existing._id },
        { $set: { 
          acceptedFileTypes: webinarVideoMediaType.acceptedFileTypes
        }}
      );
      console.log('Update result:', result);
    } else {
      // Insert the new media type
      const result = await mongoose.connection.collection('mediatypes').insertOne(webinarVideoMediaType);
      console.log('Webinar Video media type created:', result);
    }
    
    // Verify the media type is in the database
    const mediaType = await mongoose.connection.collection('mediatypes').findOne({ 
      name: 'Webinar Video'
    });
    
    console.log('Verified Webinar Video media type in database:');
    console.log(JSON.stringify(mediaType, null, 2));
    
  } catch (error) {
    console.error('Error creating Webinar Video media type:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

createWebinarVideo(); 