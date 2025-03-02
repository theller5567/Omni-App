import express from 'express';
import User from '../models/User.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Middleware to parse JSON bodies
router.use(express.json());

// Route to get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    // Assuming req.user contains the authenticated user's info
    console.log(req.user, 'req.user');
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error); // Log the error for debugging
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to update user profile
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is available in req.user
    const updates = req.body;
    const user = await User.findByIdAndUpdate(userId, updates, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;