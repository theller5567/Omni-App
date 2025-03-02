import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the absolute path to the .env file
const envPath = path.resolve(__dirname, '../../.env');

// Load environment variables from the absolute path to the .env file
dotenv.config({ path: envPath });


export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('Authorization header missing');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('Token missing');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Replace with your secret
    req.user = decoded;
    console.log('Decoded token:', decoded);
    next();
  } catch (error) {
    console.log('Invalid token');
    res.status(401).json({ message: 'Invalid token' });
  }
}

export default authenticate;