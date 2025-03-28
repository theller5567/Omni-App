import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

router.get('/users', authenticate, async (req, res) => {
    console.log('Getting users', req.user);
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;