// backend/scripts/addApprovalFields.js
import mongoose from 'mongoose';
import { getDatabaseConnection } from '../config/db.js'; // Adjust path if needed
import Media from '../models/Media.js'; // Adjust path if needed

const MONGO_URI = 'mongodb+srv://theller5567:Noel1124%23%24%23%24%23%24@omniapp.efzkv.mongodb.net/myappdb?retryWrites=true&w=majority&ssl=true';
const DEFAULT_APPROVED_BY_USER_ID = '67c732b32af71c02fcd8fe24'; // Your provided default admin/system user ID

const runScript = async () => {
  if (!MONGO_URI) {
    console.error('MONGO_URI is not defined. Please set it in your environment variables or in the script.');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    // Use your existing getDatabaseConnection or connect directly
    // If getDatabaseConnection doesn't automatically connect or needs a URI, adjust accordingly.
    // For direct connection:
    await mongoose.connect(MONGO_URI);
    console.log('Successfully connected to MongoDB.');

    const defaultApprovedById = DEFAULT_APPROVED_BY_USER_ID ? new mongoose.Types.ObjectId(DEFAULT_APPROVED_BY_USER_ID) : undefined;

    console.log('Finding media files missing approvalStatus or approvedAt...');

    const mediaToUpdate = await Media.find({
      $or: [
        { approvalStatus: { $exists: false } },
        { approvedAt: { $exists: false } },
      ],
    });

    if (mediaToUpdate.length === 0) {
      console.log('No media files found that need updating.');
      return;
    }

    console.log(`Found ${mediaToUpdate.length} media file(s) to update.`);
    let updatedCount = 0;
    let errorCount = 0;

    for (const media of mediaToUpdate) {
      try {
        const updateOperations = {};
        let needsSave = false;

        if (media.approvalStatus !== 'approved') {
          updateOperations.approvalStatus = 'approved';
          needsSave = true;
        }
        if (!media.approvedAt) {
          updateOperations.approvedAt = new Date();
          needsSave = true;
        }
        if (!media.approvedBy && defaultApprovedById) {
          updateOperations.approvedBy = defaultApprovedById;
          needsSave = true;
        } else if (!media.approvedBy && !defaultApprovedById) {
          // If no default user ID is provided, and approvedBy is missing,
          // we explicitly set it to undefined if it wasn't already.
          // Mongoose might strip undefined fields, but this ensures the logic is clear.
          if (media.approvedBy !== undefined) {
             updateOperations.approvedBy = undefined;
             needsSave = true;
          }
        }


        if (needsSave) {
          // Perform the update using $set to only modify specified fields
          const result = await Media.updateOne(
            { _id: media._id },
            { $set: updateOperations }
          );

          if (result.modifiedCount > 0) {
            console.log(`Updated media file: ${media._id} - Title: ${media.title || 'N/A'}`);
            updatedCount++;
          } else if (result.matchedCount > 0 && result.modifiedCount === 0) {
            console.log(`Media file already had necessary values (or no change needed): ${media._id}`);
          } else {
             console.warn(`Media file ${media._id} was matched but not modified. This might indicate an issue or that the values were already correct.`);
          }
        } else {
          console.log(`No update needed for media file (already compliant): ${media._id}`);
        }
      } catch (error) {
        console.error(`Error updating media file ${media._id}:`, error);
        errorCount++;
      }
    }

    console.log('\n--- Script Summary ---');
    console.log(`Total media files found needing potential update: ${mediaToUpdate.length}`);
    console.log(`Successfully updated media files: ${updatedCount}`);
    console.log(`Media files with errors during update: ${errorCount}`);
    console.log('----------------------');

  } catch (error) {
    console.error('An error occurred during the script execution:', error);
  } finally {
    console.log('Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('Successfully disconnected.');
  }
};

runScript();