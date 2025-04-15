import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import hubspotRoutes from './routes/hubspotRoutes.js';
import tagRoutes from './routes/tagRoutes.js';
import mediaTypeRoutes from './routes/mediaTypeRoutes.js';
import utilityRoutes from './routes/utilityRoutes.js';
// Load environment variables from .env file
dotenv.config();

const app = express();

// Enable CORS - more permissive configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if(!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'https://omni-app-mern.onrender.com',
      'http://localhost:5173',
      'http://localhost:5174',
      'https://omni-media-library.netlify.app', // Netlify subdomain
      'https://nerdycoder.com',                 // Primary domain
      'https://www.nerdycoder.com',             // www subdomain
      'http://nerdycoder.com',                  // Non-https versions
      'http://www.nerdycoder.com'
    ];
    
    // Check if the origin is in our allowed list
    // Also allow all netlify.app and netlify.live domains
    if(allowedOrigins.indexOf(origin) !== -1 || 
       origin.endsWith('.netlify.app') || 
       origin.endsWith('.netlify.live')) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      // Allow all origins temporarily for debugging
      callback(null, true);
      // To restrict again, use:
      // callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Add preflight OPTIONS handler for all routes
app.options('*', cors());

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/users', userRoutes);
app.use('/media', mediaRoutes);
app.use('/media/upload', mediaRoutes);
app.use('/media-types', mediaRoutes);
app.use('/api/hubspot', hubspotRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/media-types', mediaTypeRoutes);
app.use('/api/utility', utilityRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Omni App API');
});

// Enable Mongoose debug mode
mongoose.set('debug', true);

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error('MongoDB URI is not defined in environment variables');
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => {
    console.log('MongoDB connected');
    const PORT = process.env.PORT || 5002;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Could not connect to MongoDB', err);
    process.exit(1);
  });

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    message: 'An unexpected error occurred',
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});
