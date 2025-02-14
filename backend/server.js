import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import fileRoutes from './routes/fileRoutes.js';

// Load environment variables from .env file
dotenv.config();
// Import the cors package

const app = express();

// Use CORS to allow all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);  // Log every incoming request
  next();  // Pass to the next middleware/route handler
});


app.use(cors({
  origin: 'http://localhost:5173', // Replace this with your frontend's URL (for local development)
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed HTTP methods
  credentials: true, // Allow cookies or credentials (if needed)
}));


// Middleware
app.use(bodyParser.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/files', fileRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Omni App API');
});

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error('MongoDB URI is not defined in environment variables');
  process.exit(1);
}

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
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
