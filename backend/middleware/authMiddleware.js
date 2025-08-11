import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import LoggerService from '../services/loggerService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });


export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.accessToken;
  if (!authHeader && !cookieToken) {
    LoggerService.logUserActivity({
      action: 'AUTHENTICATION_FAILURE',
      details: 'No authorization header',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return res.status(401).json({ error: 'Authorization header missing' });
  }

  const token = cookieToken || (authHeader ? authHeader.split(' ')[1] : null);
  if (!token) {
    LoggerService.logUserActivity({
      action: 'AUTHENTICATION_FAILURE',
      details: 'No token in header',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    return res.status(401).json({ error: 'Access denied, token missing!' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    LoggerService.logUserActivity({
      userId: decoded.id,
      username: decoded.username,
      action: 'AUTHENTICATION_SUCCESS',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    next();
  } catch (error) {
    LoggerService.logUserActivity({
      action: 'AUTHENTICATION_FAILURE',
      details: `Token verification failed: ${error.message}`,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Track user activities
export const trackUserActivity = (activityType) => {
  return async (req, res, next) => {
    // Call the original handler
    next();
    
    // After the response has been sent, log the activity
    // This ensures we don't block the response
    try {
      if (req.user) {
        // Get client info
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];
        
        // Log the activity
        await LoggerService.logUserActivity({
          userId: req.user.id,
          username: req.user.username || req.user.email,
          email: req.user.email,
          action: activityType,
          ip,
          userAgent,
          details: {
            // Include additional details if needed
            path: req.originalUrl,
            method: req.method
          }
        });
      }
    } catch (error) {
      // Don't let logging errors affect the API response
      console.error('Error logging user activity:', error);
    }
  };
};

export default authenticate;