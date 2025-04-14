import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Media from './models/Media.js';
import { fileURLToPath } from 'url';

// Get current file's directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the absolute path to the .env file in the project root
const envPath = path.resolve(__dirname, '../.env');
console.log('Loading environment variables from:', envPath);

// Load environment variables from the absolute path
dotenv.config({ path: envPath });

// Get MongoDB URI from environment variables
const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error('MongoDB URI is not defined in environment variables');
  process.exit(1);
}

console.log('Using MongoDB URI:', mongoUri.substring(0, 20) + '...');

// Connect to MongoDB
mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB connected for debugging'))
  .catch(err => console.error('MongoDB connection error:', err));

const fixMedia = async () => {
  try {
    console.log('Attempting to update media file...');
    
    // Direct update to skip any middleware or validation
    const result = await mongoose.connection.collection('media')
      .updateOne(
        { _id: new mongoose.Types.ObjectId('67f54d5ce7a624343173a28f') },
        { 
          $set: { 
            'metadata.tags': ['Product image']
          }
        }
      );
    
    console.log('Direct update result:', result);
    
    // Verify the update
    const updatedMedia = await Media.findById('67f54d5ce7a624343173a28f');
    
    if (!updatedMedia) {
      console.log('Media not found after update');
    } else {
      console.log('Media after update:', JSON.stringify({
        id: updatedMedia._id,
        title: updatedMedia.title,
        metadata: updatedMedia.metadata,
        tags: updatedMedia.metadata?.tags || []
      }, null, 2));
    }
    
    // Disconnect after done
    mongoose.disconnect();
  } catch (error) {
    console.error('Error fixing media file:', error);
    mongoose.disconnect();
  }
};

console.log('Starting media fix...');
setTimeout(fixMedia, 1000); // Give MongoDB connection time to establish 