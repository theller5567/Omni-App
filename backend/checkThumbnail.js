// Script to check the current thumbnail value in MongoDB
import mongoose from 'mongoose';

const mediaId = '67f6d6ee80ce5846bca45c46'; // The ID you mentioned in your logs

// Using the connection string directly from your server.log
const mongoUri = 'mongodb+srv://theller5567:Noel1124%23%24%23%24%23%24@omniapp.efzkv.mongodb.net/myappdb?retryWrites=true&w=majority&ssl=true';

// Connect to MongoDB
mongoose.connect(mongoUri)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Get the media collection
    const mediaCollection = mongoose.connection.db.collection('media');
    
    // Find the document
    const mediaDoc = await mediaCollection.findOne({ _id: new mongoose.Types.ObjectId(mediaId) });
    
    if (!mediaDoc) {
      console.error('Media document not found!');
      process.exit(1);
    }
    
    // Log the thumbnail-related fields
    console.log('--- Thumbnail Fields in MongoDB ---');
    console.log('metadata.v_thumbnail:', mediaDoc.metadata?.v_thumbnail);
    console.log('metadata.thumbnailUrl:', mediaDoc.metadata?.thumbnailUrl);
    console.log('metadata.v_thumbnailTimestamp:', mediaDoc.metadata?.v_thumbnailTimestamp);
    console.log('metadata.thumbnailTimestamp:', mediaDoc.metadata?.thumbnailTimestamp);
    console.log('----------------------------------');
    
    // Check if any old fields are present that might be causing issues
    const oldFields = Object.keys(mediaDoc.metadata || {})
      .filter(key => key.includes('thumbnail') && !['v_thumbnail', 'v_thumbnailTimestamp'].includes(key));
    
    if (oldFields.length > 0) {
      console.log('⚠️ Found legacy thumbnail fields that may be causing conflicts:');
      oldFields.forEach(field => {
        console.log(`- ${field}: ${mediaDoc.metadata[field]}`);
      });
    }
    
    // Exit
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }); 