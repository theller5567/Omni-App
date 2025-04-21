import express from 'express';
const router = express.Router();
import tagCategoryController from '../controllers/tagCategoryController.js';
import { authenticate } from '../middleware/authMiddleware.js'; 

// Log all requests to tag category routes for debugging
router.use((req, res, next) => {
  console.log(`TAG CATEGORY ROUTE - ${req.method} ${req.originalUrl}`);
  next();
});

// Public GET routes (accessible to all authenticated users)
router.get('/', tagCategoryController.getTagCategories);
router.get('/:id', tagCategoryController.getTagCategory);

// Protected routes (require authentication)
router.post('/', authenticate, tagCategoryController.createTagCategory);
router.put('/:id', authenticate, tagCategoryController.updateTagCategory);
router.delete('/:id', authenticate, tagCategoryController.deleteTagCategory);

export default router;