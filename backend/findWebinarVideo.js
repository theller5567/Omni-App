import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables from .env file
dotenv.config({ path: '../.env' });

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    
    if (!mongoURI) {
      console.error('MONGO_URI environment variable not found');
      process.exit(1);
    }
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected');
    
    // Query for Webinar Video media types
    const Media = mongoose.model('Media');
    const webinarVideos = await Media.find({ 'mediaType.name': 'Webinar Video' });
    
    console.log(`Found ${webinarVideos.length} Webinar Videos:`);
    console.log(JSON.stringify(webinarVideos, null, 2));
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

// Run the function
connectDB(); 