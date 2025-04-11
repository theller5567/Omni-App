import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import hubspotRoutes from './routes/hubspotRoutes.js';
import accountRoutes from './routes/accountRoutes.js';
import tagRoutes from './routes/tagRoutes.js';
import mediaTypeRoutes from './routes/mediaTypeRoutes.js';
import utilityRoutes from './routes/utilityRoutes.js';
// Load environment variables from .env file
dotenv.config();

const app = express();

// Enable CORS
app.use(cors({
  origin: 'http://localhost:5173', // Replace with your frontend's URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/users', userRoutes);
app.use('/media', mediaRoutes);
app.use('/media/upload', mediaRoutes);
app.use('/media-types', mediaRoutes);
app.use('/api/hubspot', hubspotRoutes);
app.use('/api/account', accountRoutes);
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
