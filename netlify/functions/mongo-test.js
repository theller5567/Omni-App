// Simple MongoDB connection test
const mongoose = require('mongoose');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    // Log MongoDB URI (but mask the password)
    let dbUri = process.env.MONGODB_URI || '';
    if (dbUri) {
      const maskedUri = dbUri.replace(/:([^@]+)@/, ':******@');
      console.log('Using MongoDB URI:', maskedUri);
    } else {
      console.log('MONGODB_URI environment variable is not set');
    }

    // Return early if no MongoDB URI
    if (!process.env.MONGODB_URI) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: true, 
          message: 'MONGODB_URI environment variable is not set',
          env: {
            hasMongoUri: !!process.env.MONGODB_URI,
            hasJwtSecret: !!process.env.JWT_SECRET,
            nodeEnv: process.env.NODE_ENV || 'not set'
          }
        })
      };
    }

    // Attempt MongoDB connection
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // 5 second timeout
    });

    console.log('MongoDB connected successfully');
    
    // Return success
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'MongoDB connected successfully',
        timestamp: new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    
    // Return error details
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: true,
        message: 'MongoDB connection failed',
        details: error.message,
        stack: error.stack,
        code: error.code
      })
    };
  } finally {
    // Close the connection if it was established
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  }
}; 