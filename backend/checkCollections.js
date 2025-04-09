import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const checkCollections = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/omni');
    console.log('Connected to MongoDB');
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('No collections found in the database');
      return;
    }
    
    console.log(`Found ${collections.length} collections:`);
    collections.forEach(collection => {
      console.log(`- Name: ${collection.name}, Type: ${collection.type}`);
    });
    
    // Check model name mappings
    console.log('\nChecking model names:');
    console.log('Mongoose models:', Object.keys(mongoose.models));
    
  } catch (error) {
    console.error('Error checking collections:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

checkCollections(); 