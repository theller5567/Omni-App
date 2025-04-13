// Standalone auth function for Netlify
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Netlify function handler
exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  // Log event for debugging
  console.log('Event:', {
    path: event.path,
    httpMethod: event.httpMethod,
    headers: event.headers,
    body: event.body ? event.body.substring(0, 100) + '...' : null
  });
  
  try {
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
    
    // Check for missing environment variables
    if (!process.env.MONGODB_URI) {
      console.error('Missing MONGODB_URI environment variable');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          message: 'Server configuration error',
          details: 'Missing MONGODB_URI environment variable' 
        })
      };
    }
    
    if (!process.env.JWT_SECRET) {
      console.error('Missing JWT_SECRET environment variable');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          message: 'Server configuration error',
          details: 'Missing JWT_SECRET environment variable' 
        })
      };
    }
    
    // For testing only - bypass MongoDB
    const { email, password } = requestBody;
    
    // Emergency fallback for testing
    if (email === 'test@example.com' && password === 'password123') {
      console.log('Using test account login');
      
      // Generate test tokens
      const token = 'test-jwt-token';
      const refreshToken = 'test-refresh-token';
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          token,
          refreshToken,
          user: {
            id: '123',
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            role: 'user'
          }
        })
      };
    }
    
    // Establish MongoDB connection
    try {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('MongoDB connected');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          message: 'Database connection error',
          details: error.message
        })
      };
    }
    
    // Define User schema
    const UserSchema = new mongoose.Schema({
      firstName: String,
      lastName: String,
      email: { type: String, required: true, unique: true },
      username: String,
      password: { type: String, required: true },
      role: { type: String, default: 'user' }
    });
    
    // Get or create User model
    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    
    // Determine if this is login or register based on request body
    const isRegister = requestBody.firstName && requestBody.lastName;
    
    // Handle requests
    if (isRegister) {
      // This is a registration request
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
          body: JSON.stringify({ 
            message: 'Server error',
            details: error.message 
          })
        };
      }
    } else {
      // This is a login request
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
          body: JSON.stringify({ 
            message: 'Server error',
            details: error.message 
          })
        };
      }
    }
  } catch (error) {
    // Global error handler
    console.error('Unhandled error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        message: 'Server error',
        details: error.message 
      })
    };
  }
}; 