import ActivityLog from '../models/ActivityLog.js';
import UserActivity from '../models/UserActivity.js';
import User from '../models/User.js';

/**
 * Service for logging activities and user actions
 */
class LoggerService {
  /**
   * Log an activity in the system
   * 
   * @param {Object} data - Activity data
   * @param {string} data.userId - User ID who performed the action
   * @param {string} data.username - Username (optional, will be looked up if not provided)
   * @param {string} data.action - Action performed (UPLOAD, DELETE, EDIT, CREATE, VIEW)
   * @param {string} data.details - Details about the action
   * @param {string} data.resourceType - Type of resource (media, mediaType, user, system)
   * @param {string} data.resourceId - ID of the resource
   * @param {string} data.mediaSlug - Slug of the media resource (optional)
   * @returns {Promise<Object>} - The created activity log
   */
  static async logActivity(data) {
    try {
      // If username is not provided, look it up from the user ID
      if (!data.username && data.userId) {
        const user = await User.findById(data.userId);
        if (user) {
          data.username = user.username || `${user.firstName} ${user.lastName}`;
        }
      }
      
      // Create the activity log
      const activityLog = new ActivityLog({
        userId: data.userId,
        username: data.username || 'Unknown User',
        action: data.action,
        details: data.details,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        mediaSlug: data.mediaSlug || null,
        timestamp: data.timestamp || new Date(),
        tagId: data.tagId || null,
        tagName: data.tagName || null,
        tagCategoryId: data.tagCategoryId || null,
        tagCategoryName: data.tagCategoryName || null
      });
      
      // Save to database
      await activityLog.save();
      
      console.log(`Activity logged: [${data.action}] ${data.details} by ${data.username || data.userId}`);
      
      return activityLog;
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw the error - logging should be non-blocking
      return null;
    }
  }
  
  /**
   * Log a user activity (login, logout, etc.)
   * 
   * @param {Object} data - User activity data
   * @param {string} data.userId - User ID
   * @param {string} data.username - Username (optional, will be looked up if not provided)
   * @param {string} data.email - User email (optional, will be looked up if not provided)
   * @param {string} data.action - Action (LOGIN, LOGOUT, PASSWORD_CHANGE, PROFILE_UPDATE, FAILED_LOGIN)
   * @param {string} data.ip - IP address
   * @param {string} data.userAgent - User agent string
   * @param {Object} data.details - Additional details (optional)
   * @returns {Promise<Object>} - The created user activity
   */
  static async logUserActivity(data) {
    try {
      // If username/email is not provided, look it up from the user ID
      if ((!data.username || !data.email) && data.userId) {
        const user = await User.findById(data.userId);
        if (user) {
          data.username = data.username || user.username || `${user.firstName} ${user.lastName}`;
          data.email = data.email || user.email;
        }
      }
      
      // Create the user activity
      const userActivity = new UserActivity({
        userId: data.userId,
        username: data.username || 'Unknown User',
        email: data.email || 'unknown@example.com',
        action: data.action,
        ip: data.ip || '0.0.0.0',
        userAgent: data.userAgent || 'Unknown',
        timestamp: data.timestamp || new Date(),
        details: data.details || {}
      });
      
      // Save to database
      await userActivity.save();
      
      console.log(`User activity logged: [${data.action}] by ${data.username || data.userId} from ${data.ip}`);
      
      return userActivity;
    } catch (error) {
      console.error('Error logging user activity:', error);
      // Don't throw the error - logging should be non-blocking
      return null;
    }
  }
  
  /**
   * Get recent activity logs
   * 
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of logs to return
   * @param {number} options.skip - Number of logs to skip
   * @param {string} options.userId - Filter by user ID
   * @param {string} options.action - Filter by action
   * @param {string} options.resourceType - Filter by resource type
   * @param {Date} options.startDate - Start date for filtering
   * @param {Date} options.endDate - End date for filtering
   * @returns {Promise<Array>} - The activity logs
   */
  static async getActivityLogs(options = {}) {
    try {
      const query = {};
      
      // Add filters if provided
      if (options.userId) query.userId = options.userId;
      if (options.action) query.action = options.action;
      if (options.resourceType) query.resourceType = options.resourceType;
      
      // Add date range if provided
      if (options.startDate || options.endDate) {
        query.timestamp = {};
        if (options.startDate) query.timestamp.$gte = options.startDate;
        if (options.endDate) query.timestamp.$lte = options.endDate;
      }
      
      // Create the query with pagination
      const limit = options.limit || 20;
      const skip = options.skip || 0;
      
      const logs = await ActivityLog.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip);
      
      const total = await ActivityLog.countDocuments(query);
      
      return { logs, total };
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      throw error;
    }
  }
  
  /**
   * Get user activities
   * 
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of activities to return
   * @param {number} options.skip - Number of activities to skip
   * @param {string} options.userId - Filter by user ID
   * @param {string} options.action - Filter by action
   * @param {string} options.ip - Filter by IP address
   * @param {Date} options.startDate - Start date for filtering
   * @param {Date} options.endDate - End date for filtering
   * @returns {Promise<Array>} - The user activities
   */
  static async getUserActivities(options = {}) {
    try {
      const query = {};
      
      // Add filters if provided
      if (options.userId) query.userId = options.userId;
      if (options.action) query.action = options.action;
      if (options.ip) query.ip = options.ip;
      
      // Add date range if provided
      if (options.startDate || options.endDate) {
        query.timestamp = {};
        if (options.startDate) query.timestamp.$gte = options.startDate;
        if (options.endDate) query.timestamp.$lte = options.endDate;
      }
      
      // Create the query with pagination
      const limit = options.limit || 10;
      const skip = options.skip || 0;
      
      const activities = await UserActivity.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip);
      
      const total = await UserActivity.countDocuments(query);
      
      return { activities, total };
    } catch (error) {
      console.error('Error fetching user activities:', error);
      throw error;
    }
  }
}

export default LoggerService; 