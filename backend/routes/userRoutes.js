import express from 'express';
import User from '../models/User.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { getUsernameById, getUserPublicProfileById } from '../controllers/userController.js';

const router = express.Router();

// Middleware to parse JSON bodies
router.use(express.json());

// Get all users - consolidated route
// This combines the functionality from both files
router.get('/', authenticate, async (req, res) => {
  console.log('Fetching all users');
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to get user profile
router.get('/profile', authenticate, async (req, res) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Authentication error: User ID not found in token' });
  }
  
  try {
    const userId = req.user.id;
    console.log(`Fetching profile for user ID: ${userId}`);
    const user = await User.findById(userId);

    if (!user) {
      console.log(`User with ID ${userId} not found in database.`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return the user object, which includes all necessary fields
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error while fetching user profile.' });
  }
});

// Route to update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    // Get user ID from authenticated user
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found in token' });
    }
    
    console.log('Updating profile for user:', userId);
    
    const updates = req.body;
    const user = await User.findByIdAndUpdate(userId, updates, { new: true });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get username by ID
router.get('/username/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const username = await getUsernameById(userId);
    res.status(200).json({ username });
  } catch (error) {
    console.error('Error fetching username:', error);
    res.status(404).json({ error: 'User not found' });
  }
});

// Route to get public user profile by ID
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userProfile = await getUserPublicProfileById(userId);
    res.status(200).json(userProfile);
  } catch (error) {
    // Log the error and send an appropriate status code
    console.error('Error in GET /users/:userId route:', error.message);
    if (error.message === 'User not found') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
});

// Update user by ID - Added from accountRoutes.js functionality
router.put('/:userId', authenticate, async (req, res) => {
  try {
    // Debug the user role being checked
    console.log('Update user request from:', {
      user: req.user,
      userRole: req.user.role,
      targetUserId: req.params.userId
    });
    
    // Check if the authenticated user has the appropriate role (admin or superAdmin)
    if (!req.user || !['admin', 'superAdmin'].includes(req.user.role)) {
      console.log('Authorization failed. User role:', req.user?.role);
      return res.status(403).json({ message: 'Not authorized to update users' });
    }
    
    const { userId } = req.params;
    const updates = req.body;
    
    const user = await User.findByIdAndUpdate(userId, updates, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;