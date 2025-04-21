import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });


export const authenticate = (req, res, next) => {
  console.log('AUTH MIDDLEWARE - Headers:', req.headers);
  
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('AUTH MIDDLEWARE - No authorization header found');
    return res.status(401).json({ error: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('AUTH MIDDLEWARE - No token found in authorization header');
    return res.status(401).json({ error: 'Access denied, token missing!' });
  }

  try {
    console.log('AUTH MIDDLEWARE - Verifying token');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('AUTH MIDDLEWARE - Token verified, user:', decoded);
    req.user = decoded; // Attach user info to req
    next();
  } catch (error) {
    console.error('AUTH MIDDLEWARE - Token verification failed:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}

export default authenticate;