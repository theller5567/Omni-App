import User from '../models/User.js';

/**
 * Middleware to check if the authenticated user has admin privileges
 */
export const isAdmin = async (req, res, next) => {
  try {
    // Check if req.user exists (should be set by the authenticate middleware)
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Get the user from the database to ensure we have the most up-to-date role
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Check if the user has an admin role
    if (user.role !== 'admin' && user.role !== 'superAdmin') {
      console.log(`User ${user._id} with role ${user.role} attempted to access admin route`);
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    // If user is admin, proceed
    next();
  } catch (error) {
    console.error('Error in admin middleware:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 