import mongoose from 'mongoose';
import MediaType from './models/MediaType.js';
import dotenv from 'dotenv';

dotenv.config();

const listMediaTypes = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/omni');
    console.log('Connected to MongoDB');
    
    // Find all media types
    const mediaTypes = await MediaType.find();
    
    if (mediaTypes.length === 0) {
      console.log('No media types found');
      return;
    }
    
    console.log(`Found ${mediaTypes.length} media types:`);
    mediaTypes.forEach(type => {
      console.log(`- ID: ${type._id}, Name: "${type.name}", Status: ${type.status}`);
      console.log(`  Accepted File Types: ${type.acceptedFileTypes?.join(', ') || 'none'}`);
      console.log(`  Fields: ${type.fields.map(f => f.name).join(', ')}`);
      console.log('-----------------------------------------');
    });
  } catch (error) {
    console.error('Error listing media types:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

listMediaTypes(); 