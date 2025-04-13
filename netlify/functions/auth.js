// Standalone auth function for Netlify
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// User schema
const UserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, required: true, unique: true },
  username: String,
  password: { type: String, required: true },
  role: { type: String, default: 'user' }
});

// Initialize MongoDB connection outside of handler to allow connection reuse
let cachedDb = null;
const connectToDatabase = async () => {
  if (cachedDb) {
    console.log('Using cached database connection');
    return cachedDb;
  }
  
  console.log('Creating new database connection');
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    cachedDb = connection;
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Netlify function handler
exports.handler = async (event, context) => {
  // Keep alive DB connection during function warmup
  context.callbackWaitsForEmptyEventLoop = false;
  
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'OK' })
    };
  }
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }
  
  // Parse the path to determine if this is a login or register request
  const path = event.path.toLowerCase();
  console.log('Request path:', path);
  
  // Connect to database
  try {
    await connectToDatabase();
  } catch (error) {
    console.error('Database connection error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Database connection error' })
    };
  }
  
  // Get the User model
  const User = mongoose.models.User || mongoose.model('User', UserSchema);
  
  // Parse request body
  let requestBody;
  try {
    requestBody = JSON.parse(event.body);
    console.log('Request body:', requestBody);
  } catch (error) {
    console.error('Error parsing request body:', error);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: 'Invalid request body' })
    };
  }
  
  // Handle login request
  if (path.includes('/login')) {
    try {
      const { email, password } = requestBody;
      
      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'Invalid credentials' })
        };
      }
      
      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'Invalid credentials' })
        };
      }
      
      // Generate token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'default_jwt_secret',
        { expiresIn: '24h' }
      );
      
      // Generate refresh token
      const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
        { expiresIn: '7d' }
      );
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          token,
          refreshToken,
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role
          }
        })
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ message: 'Server error' })
      };
    }
  }
  
  // Handle registration request
  if (path.includes('/register')) {
    try {
      const { firstName, lastName, email, username, password } = requestBody;
      
      // Check if user exists
      let user = await User.findOne({ email });
      if (user) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'User already exists' })
        };
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Create user
      user = new User({
        firstName,
        lastName,
        email,
        username,
        password: hashedPassword
      });
      
      await user.save();
      
      // Generate token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'default_jwt_secret',
        { expiresIn: '24h' }
      );
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          token,
          refreshToken: '',
          user: {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role
          },
          message: 'User registered successfully'
        })
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ message: 'Server error' })
      };
    }
  }
  
  // If we get here, it's an unknown endpoint
  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ message: 'Endpoint not found' })
  };
}; 