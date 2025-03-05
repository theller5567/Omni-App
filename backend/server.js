import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import hubspotRoutes from './routes/hubspotRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import axios from 'axios';

// Load environment variables from .env file
dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Enable CORS
app.use(cors({
  origin: 'http://localhost:5173', // Replace with your frontend's URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// Read mock data from JSON file
const mockData = JSON.parse(fs.readFileSync(path.join(__dirname, 'mockData.json'), 'utf-8'));


// Middleware
app.use(bodyParser.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/media', mediaRoutes);
app.use('/api/hubspot', hubspotRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Omni App API');
});

// app.get('/api/quotes', async (req, res) => {
//   try {
//     const response = await axios.get('https://api.hubapi.com/crm/v3/objects/quotes', {
//       headers: {
//         Authorization: `Bearer YOUR_ACCESS_TOKEN`,
//       },
//     });
//     res.json(response.data);
//   } catch (error) {
//     res.status(500).json({ error: 'Error fetching data from HubSpot' });
//   }
// });

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
