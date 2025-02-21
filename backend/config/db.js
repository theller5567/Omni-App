import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });  // Load environment variables from .env file

import { MongoClient } from 'mongodb';


const mongoUri = process.env.MONGO_URI;
const mongoDB = process.env.MONGODB_DATABASE;

// Debugging: Log the URI to check if it's being read correctly
console.log('MongoDB URI:', mongoUri);

let client;

export const getDatabaseConnection = async () => {
  if (!client) {
    if (!mongoUri) {
      throw new Error('MongoDB URI is not defined. Please check your environment variables.');
    }
    client = new MongoClient(mongoUri);
    await client.connect();
  }
  return client.db(process.env.MONGODB_DATABASE); // Ensure this matches your database name
};
