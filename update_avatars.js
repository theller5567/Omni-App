const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Update users with avatars to use lowercase initials
async function updateAvatars() {
  // Get MongoDB URI from environment variables
  const mongoUri = process.env.MONGO_URI;
  
  if (!mongoUri) {
    console.error('Error: MONGO_URI environment variable is not set');
    console.error('Please make sure the .env file contains the MONGO_URI variable');
    process.exit(1);
  }
  
  console.log(`Using MongoDB connection from .env: ${mongoUri.substring(0, 15)}...`);
  const client = new MongoClient(mongoUri);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Get the database from the URI
    const db = client.db();
    console.log(`Using database: ${db.databaseName}`);
    
    const usersCollection = db.collection('users');
    
    // First, check how many total users we have
    const totalUsers = await usersCollection.countDocuments();
    console.log(`Total users in database: ${totalUsers}`);
    
    // Find all users - we'll update everyone
    const users = await usersCollection.find({}).toArray();
    
    console.log(`Found ${users.length} users to update with lowercase initials`);
    
    if (users.length === 0) {
      console.log('No users to update. Exiting...');
      return;
    }
    
    // Update each user
    for (const user of users) {
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      // Create lowercase initials
      const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toLowerCase();
      
      // Create avatar URL with lowercase initials
      const avatarUrl = `https://api.dicebear.com/9.x/initials/svg?seed=${initials}&radius=50&backgroundType=gradientLinear&fontSize=26&backgroundRotation=-205`;
      
      // Update user
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { avatar: avatarUrl } }
      );
      
      console.log(`Updated avatar for user: ${user.email || 'Unknown'} with lowercase initials: ${initials}`);
    }
    
    console.log('All avatars updated with lowercase initials successfully!');
    
  } catch (error) {
    console.error('Error updating avatars:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
updateAvatars();
