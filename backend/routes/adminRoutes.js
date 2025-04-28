import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/adminMiddleware.js';
import { 
  getDatabaseStats, 
  getActivityLogs, 
  getUserActivities 
} from '../controllers/adminController.js';

const router = express.Router();

// Middleware to authenticate and check admin role for all admin routes
router.use(authenticate);
router.use(isAdmin);

// Database statistics endpoint
router.get('/database-stats', getDatabaseStats);

// Activity logs endpoint
router.get('/activity-logs', getActivityLogs);

// User activities endpoint
router.get('/user-activities', getUserActivities);

export default router; 