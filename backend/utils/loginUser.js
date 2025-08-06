import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import LoggerService from '../services/loggerService.js';
import ActivityTrackingService from '../services/activityTrackingService.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email });
    
    // Get client info for logging
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    if (!user) {
      // Track failed login attempt with non-existent email
      await ActivityTrackingService.trackFailedLogin(email, ip, userAgent);
      return res.status(401).json({ error: 'Invalid credentials - email' });
    }

    // Debugging: Log the plain text password and hashed password
    user.password = await bcrypt.hash(password, 10);
    // Use bcrypt to compare the plain text password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // Debugging: Log the result of the password comparison
    console.log('Is password valid:', isPasswordValid);

    if (!isPasswordValid) {
      // Track failed login attempt with valid email but invalid password
      await ActivityTrackingService.trackFailedLogin(email, ip, userAgent);
      return res.status(401).json({ error: 'Invalid credentials - password' });
    }

    // Include important user info in the token payload
    const accessToken = jwt.sign({ 
      email: user.email,
      id: user._id,
      role: user.role
    }, process.env.JWT_SECRET, { expiresIn: '15m' });

    const refreshToken = jwt.sign({ 
      id: user._id 
    }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    console.log('Generated token with payload:', {
      email: user.email,
      id: user._id,
      role: user.role
    });
    
    // Track successful login
    await LoggerService.logUserActivity({
      userId: user._id,
      username: user.username || `${user.firstName} ${user.lastName}`,
      email: user.email,
      action: 'LOGIN',
      ip,
      userAgent,
      details: {
        success: true
      }
    });

    // Include user information in the response
    res.status(200).json({ 
      message: 'Login successful', 
      accessToken, 
      refreshToken, 
      user 
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
}; 