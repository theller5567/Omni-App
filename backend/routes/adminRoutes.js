import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { isAdmin } from '../middleware/adminMiddleware.js';
import { isSuperAdmin } from '../middleware/superAdminMiddleware.js';
import { 
  getDatabaseStats, 
  getActivityLogs, 
  getUserActivities 
} from '../controllers/adminController.js';
import {
  getNotificationSettings,
  updateNotificationSettings,
  addNotificationRule,
  updateNotificationRule,
  deleteNotificationRule,
  getEligibleRecipients,
  sendTestNotification
} from '../controllers/notificationController.js';

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

// Notification settings routes - accessible only to superAdmins
router.get('/notification-settings', isSuperAdmin, getNotificationSettings);
router.put('/notification-settings', isSuperAdmin, updateNotificationSettings);
router.post('/notification-settings/rules', isSuperAdmin, addNotificationRule);
router.put('/notification-settings/rules/:ruleId', isSuperAdmin, updateNotificationRule);
router.delete('/notification-settings/rules/:ruleId', isSuperAdmin, deleteNotificationRule);
router.get('/notification-settings/eligible-recipients', isSuperAdmin, getEligibleRecipients);
router.post('/notification-settings/test', isSuperAdmin, sendTestNotification);

export default router; 