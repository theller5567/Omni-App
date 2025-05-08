import express from 'express';
import { getTags, addTag, updateTag, deleteTag } from '../controllers/tagController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route - no authentication required
router.get('/', getTags);

// Protected routes - require authentication
router.post('/', authenticate, addTag);
router.put('/:id', authenticate, updateTag);
router.delete('/:id', authenticate, deleteTag);

export default router;
