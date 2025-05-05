// Script to update the thumbnail URL in MongoDB
import mongoose from 'mongoose';

const mediaId = '67f6d6ee80ce5846bca45c46'; // The ID you mentioned in your logs

// Using the connection string directly from your server.log
const mongoUri = 'mongodb+srv://theller5567:Noel1124%23%24%23%24%23%24@omniapp.efzkv.mongodb.net/myappdb?retryWrites=true&w=majority&ssl=true';

// The correct thumbnail URL you want to use
const correctThumbnailUrl = 'https://omnimedialibrarybucket.s3.us-east-2.amazonaws.com/67f6d6ee80ce5846bca45c46_thumbnail_1746452987480.jpg';

// Connect to MongoDB
mongoose.connect(mongoUri)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    try {
      // Get the media collection
      const mediaCollection = mongoose.connection.db.collection('media');
      
      // Find the document and show current values before update
      const beforeDoc = await mediaCollection.findOne({ _id: new mongoose.Types.ObjectId(mediaId) });
      
      if (!beforeDoc) {
        console.error('Media document not found!');
        process.exit(1);
      }
      
      console.log('Current thumbnail fields:');
      console.log('v_thumbnail:', beforeDoc.metadata?.v_thumbnail);
      console.log('thumbnailUrl:', beforeDoc.metadata?.thumbnailUrl);
      
      // Update the document with the correct thumbnail URL
      const updateResult = await mediaCollection.updateOne(
        { _id: new mongoose.Types.ObjectId(mediaId) },
        { 
          $set: { 
            'metadata.v_thumbnail': correctThumbnailUrl,
            // Remove the legacy field if it exists
            'metadata.thumbnailUrl': null
          } 
        }
      );
      
      console.log('Update result:', updateResult);
      
      // Verify the update
      const afterDoc = await mediaCollection.findOne({ _id: new mongoose.Types.ObjectId(mediaId) });
      
      console.log('\nThumbnail fields after update:');
      console.log('v_thumbnail:', afterDoc.metadata?.v_thumbnail);
      console.log('thumbnailUrl:', afterDoc.metadata?.thumbnailUrl);
      
      if (afterDoc.metadata?.v_thumbnail === correctThumbnailUrl) {
        console.log('\n✅ Success! Thumbnail URL updated correctly.');
      } else {
        console.log('\n❌ Update failed! Thumbnail URL is incorrect.');
      }
    } catch (error) {
      console.error('Error updating thumbnail URL:', error);
    } finally {
      // Disconnect from MongoDB
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }); 