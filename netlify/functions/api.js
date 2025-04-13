// Netlify Serverless Function for API
const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const AWS = require('aws-sdk');

// Configure AWS with prefixed environment variables
AWS.config.update({
  region: process.env.MY_AWS_REGION || 'us-east-2',
  accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY
});

// Import any necessary schema definitions
// (For simplicity, defining a basic User schema here, but you should use your existing models)
const UserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, required: true, unique: true },
  username: String,
  password: { type: String, required: true },
  role: { type: String, default: 'user' }
});

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log('Request URL:', req.url);
  console.log('Request Method:', req.method);
  console.log('Request Body:', req.body);
  next();
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define models
const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Auth routes - handle multiple path patterns
const handleLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
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
    
    res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Support ALL possible path patterns for login
app.post('/auth/login', handleLogin);
app.post('/api/auth/login', handleLogin);
app.post('/.netlify/functions/api/auth/login', handleLogin);
app.post('/api/.netlify/functions/api/auth/login', handleLogin);

const handleRegister = async (req, res) => {
  try {
    const { firstName, lastName, email, username, password } = req.body;
    
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
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
    
    res.status(201).json({
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
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Support ALL possible path patterns for register
app.post('/auth/register', handleRegister);
app.post('/api/auth/register', handleRegister);
app.post('/.netlify/functions/api/auth/register', handleRegister);
app.post('/api/.netlify/functions/api/auth/register', handleRegister);

// Add a test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Export the serverless handler
exports.handler = serverless(app); 