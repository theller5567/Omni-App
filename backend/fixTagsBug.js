import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
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

const fixTagsBug = async () => {
  try {
    console.log('Attempting comprehensive fix for file 67f54d5ce7a624343173a28f...');
    
    // 1. First get the current document to see what's happening
    const collection = mongoose.connection.collection('media');
    const currentDoc = await collection.findOne({ 
      _id: new mongoose.Types.ObjectId('67f54d5ce7a624343173a28f') 
    });
    
    console.log('Current document state:', JSON.stringify({
      _id: currentDoc?._id,
      title: currentDoc?.title,
      metadata: currentDoc?.metadata
    }, null, 2));
    
    // 2. First try: completely restructure metadata with tags
    const updateResult1 = await collection.updateOne(
      { _id: new mongoose.Types.ObjectId('67f54d5ce7a624343173a28f') },
      { 
        $set: { 
          'metadata': {
            ...currentDoc.metadata,
            tags: ['Product image']
          }
        }
      }
    );
    
    console.log('Update result (restructure metadata):', updateResult1);
    
    // 3. Second try: using $addToSet to add tags without duplicates
    const updateResult2 = await collection.updateOne(
      { _id: new mongoose.Types.ObjectId('67f54d5ce7a624343173a28f') },
      { 
        $addToSet: { 
          'metadata.tags': 'Product image'
        }
      }
    );
    
    console.log('Update result (add to set):', updateResult2);
    
    // 4. Third try: using array operations to ensure tags array exists
    const updateResult3 = await collection.updateOne(
      { _id: new mongoose.Types.ObjectId('67f54d5ce7a624343173a28f') },
      [
        { 
          $set: { 
            'metadata.tags': { 
              $cond: { 
                if: { $isArray: '$metadata.tags' }, 
                then: { $concatArrays: ['$metadata.tags', ['Product image']] },
                else: ['Product image'] 
              }
            }
          }
        }
      ]
    );
    
    console.log('Update result (array operations):', updateResult3);
    
    // 5. Get the updated document to verify changes
    const updatedDoc = await collection.findOne({ 
      _id: new mongoose.Types.ObjectId('67f54d5ce7a624343173a28f') 
    });
    
    console.log('Document after updates:', JSON.stringify({
      _id: updatedDoc?._id,
      title: updatedDoc?.title,
      metadata: updatedDoc?.metadata
    }, null, 2));
    
    // Disconnect after done
    console.log('Fix attempts completed');
    mongoose.disconnect();
  } catch (error) {
    console.error('Error fixing tags bug:', error);
    mongoose.disconnect();
  }
};

console.log('Starting comprehensive tags fix...');
setTimeout(fixTagsBug, 1000); // Give MongoDB connection time to establish 