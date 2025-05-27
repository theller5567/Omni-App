import mongoose from 'mongoose';
// Assuming your db connection setup is similar to addApprovalFields.js
// You might need to adjust the path to db.js and Media.js if they are different
import { getDatabaseConnection } from '../config/db.js'; 
import Media from '../models/Media.js'; 

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://theller5567:Noel1124%23%24%23%24%23%24@omniapp.efzkv.mongodb.net/myappdb?retryWrites=true&w=majority&ssl=true'; // Fallback if not in env

const runScript = async () => {
  if (!MONGO_URI) {
    console.error('MONGO_URI is not defined. Please set it in your environment variables or in the script.');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    //mongoose.set('debug', true); // Optional: Enable Mongoose debug logging
    await mongoose.connect(MONGO_URI);
    console.log('Successfully connected to MongoDB.');

    console.log('Finding media files with string-based uploadedBy field...');

    // Find documents where uploadedBy exists and is a string
    const mediaToUpdate = await Media.find({ 
      uploadedBy: { $exists: true, $type: 'string' } 
    });

    if (mediaToUpdate.length === 0) {
      console.log('No media files found with string-based uploadedBy fields that need updating.');
      await mongoose.disconnect();
      return;
    }

    console.log(`Found ${mediaToUpdate.length} media file(s) with string uploadedBy to update.`);
    let updatedCount = 0;
    let invalidIdCount = 0;
    let errorCount = 0;

    for (const media of mediaToUpdate) {
      try {
        const stringUserId = media.uploadedBy; // This is a string
        
        if (mongoose.Types.ObjectId.isValid(stringUserId)) {
          const objectIdUserId = new mongoose.Types.ObjectId(stringUserId);
          
          const result = await Media.updateOne(
            { _id: media._id },
            { $set: { uploadedBy: objectIdUserId } }
          );

          if (result.modifiedCount > 0) {
            console.log(`Updated media file: ${media._id} (Title: ${media.title || 'N/A'}) - Converted uploadedBy from string "${stringUserId}" to ObjectId.`);
            updatedCount++;
          } else if (result.matchedCount > 0 && result.modifiedCount === 0) {
            console.warn(`Media file ${media._id} was matched but not modified. This might indicate an issue or that it was already an ObjectId (though the query should prevent this).`);
          } else {
            console.warn(`Media file ${media._id} was not found for update, though it was in the initial list.`);
          }
        } else {
          console.warn(`Media file: ${media._id} (Title: ${media.title || 'N/A'}) has an invalid string for uploadedBy: "${stringUserId}". Skipping conversion.`);
          invalidIdCount++;
        }
      } catch (error) {
        console.error(`Error updating media file ${media._id}:`, error);
        errorCount++;
      }
    }

    console.log('\n--- Script Summary ---');
    console.log(`Total media files found with string uploadedBy: ${mediaToUpdate.length}`);
    console.log(`Successfully converted uploadedBy to ObjectId: ${updatedCount}`);
    console.log(`Skipped due to invalid ObjectId string format: ${invalidIdCount}`);
    console.log(`Errors during update: ${errorCount}`);
    console.log('----------------------');

  } catch (error) {
    console.error('An error occurred during the script execution:', error);
  } finally {
    console.log('Disconnecting from MongoDB...');
    //mongoose.set('debug', false);
    await mongoose.disconnect();
    console.log('Successfully disconnected.');
  }
};

runScript(); 