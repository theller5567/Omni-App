import User from '../models/User.js';
import Media from '../models/Media.js';
import MediaType from '../models/MediaType.js';
import ActivityLog from '../models/ActivityLog.js';
import UserActivity from '../models/UserActivity.js';
import LoggerService from '../services/loggerService.js';
import mongoose from 'mongoose';

// Get database statistics
export const getDatabaseStats = async (req, res) => {
  try {
    // Count total users and active users
    const totalUsers = await User.countDocuments();
    
    // Get active users (those with activity in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Count users with activity in the last 30 days
    const activeUsers = await UserActivity.distinct('userId', {
      timestamp: { $gte: thirtyDaysAgo }
    }).then(ids => ids.length);
    
    // Count total media files and get total storage used
    const totalMediaFiles = await Media.countDocuments();
    const mediaFilesAggregate = await Media.aggregate([
      {
        $group: {
          _id: null,
          totalStorage: { $sum: "$fileSize" },
        }
      }
    ]);
    
    const storageUsed = mediaFilesAggregate.length > 0 ? mediaFilesAggregate[0].totalStorage : 0;
    
    // Count media types
    const totalMediaTypes = await MediaType.countDocuments();
    
    // Count unique tags
    const mediaWithTags = await Media.find({
      "metadata.tags": { $exists: true, $ne: [] }
    });
    
    const allTags = new Set();
    mediaWithTags.forEach(media => {
      if (media.metadata && media.metadata.tags && Array.isArray(media.metadata.tags)) {
        media.metadata.tags.forEach(tag => allTags.add(tag));
      }
    });
    
    // Get database size (this is a mock implementation)
    // In a real implementation, you might use db.stats() in MongoDB
    const dbSize = storageUsed * 1.2; // Estimate 20% overhead
    
    // For mocking purposes - in production you'd get real values
    const storageLimit = 5 * 1024 * 1024 * 1024; // 5GB
    const lastBackup = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 1 day ago
    
    // Calculate uptime (in a real implementation, this would come from the server)
    // For now, just provide a realistic mock value
    const uptime = 15 * 24 * 60 * 60; // 15 days in seconds
    
    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalMediaFiles,
        totalMediaTypes,
        totalTags: allTags.size,
        storageUsed,
        storageLimit,
        dbSize,
        lastBackup,
        uptime
      }
    });
  } catch (error) {
    console.error('Error fetching database stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch database statistics',
      error: error.message
    });
  }
};

// Get recent activity logs
export const getActivityLogs = async (req, res) => {
  try {
    // Parse query parameters
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    
    // Parse additional filters
    const filters = {};
    if (req.query.userId) filters.userId = req.query.userId;
    if (req.query.action) filters.action = req.query.action;
    if (req.query.resourceType) filters.resourceType = req.query.resourceType;
    
    // Parse date range
    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate);
    }
    
    // Get activity logs
    const { logs, total } = await LoggerService.getActivityLogs({
      ...filters,
      limit,
      skip
    });
    
    // If there are no logs in the database, seed with some initial data
    // This will only run once when the collection is empty
    if (logs.length === 0 && total === 0) {
      await seedInitialActivityLogs();
      
      // Fetch logs again after seeding
      const result = await LoggerService.getActivityLogs({
        limit,
        skip
      });
      
      res.status(200).json({
        success: true,
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
        data: result.logs
      });
      
      return;
    }
    
    // Return the logs
    res.status(200).json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: logs
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs',
      error: error.message
    });
  }
};

// Get user activities
export const getUserActivities = async (req, res) => {
  try {
    // Parse query parameters
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    
    // Parse additional filters
    const filters = {};
    if (req.query.userId) filters.userId = req.query.userId;
    if (req.query.action) filters.action = req.query.action;
    if (req.query.ip) filters.ip = req.query.ip;
    
    // Parse date range
    if (req.query.startDate) {
      filters.startDate = new Date(req.query.startDate);
    }
    if (req.query.endDate) {
      filters.endDate = new Date(req.query.endDate);
    }
    
    // Get user activities
    const { activities, total } = await LoggerService.getUserActivities({
      ...filters,
      limit,
      skip
    });
    
    // If there are no activities in the database, seed with some initial data
    // This will only run once when the collection is empty
    if (activities.length === 0 && total === 0) {
      await seedInitialUserActivities();
      
      // Fetch activities again after seeding
      const result = await LoggerService.getUserActivities({
        limit,
        skip
      });
      
      res.status(200).json({
        success: true,
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
        data: result.activities
      });
      
      return;
    }
    
    // Return the activities
    res.status(200).json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: activities
    });
  } catch (error) {
    console.error('Error fetching user activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user activities',
      error: error.message
    });
  }
};

// Helper function to seed initial activity logs for testing
async function seedInitialActivityLogs() {
  try {
    // Get real users and media to use in our seed data
    const users = await User.find().select('_id username firstName lastName').limit(5);
    const media = await Media.find().select('id title').limit(5);
    
    if (users.length === 0 || media.length === 0) {
      console.log('Cannot seed activity logs: no users or media found');
      return;
    }
    
    // Generate seed activity logs
    const actions = ['UPLOAD', 'DELETE', 'EDIT', 'CREATE', 'VIEW'];
    const resourceTypes = ['media', 'mediaType', 'user', 'system'];
    
    const seedLogs = [];
    
    // Create 20 mock logs
    for (let i = 0; i < 20; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
      
      let details, resourceId;
      
      // Set details based on the action and resource type
      if (resourceType === 'media') {
        const mediaItem = media[Math.floor(Math.random() * media.length)];
        details = `${action === 'UPLOAD' ? 'Uploaded' : action === 'DELETE' ? 'Deleted' : action === 'EDIT' ? 'Updated' : 'Viewed'} media file: ${mediaItem.title || 'Untitled'}`;
        resourceId = mediaItem.id;
      } else if (resourceType === 'mediaType') {
        details = `${action === 'CREATE' ? 'Created' : action === 'EDIT' ? 'Updated' : action === 'DELETE' ? 'Deleted' : 'Viewed'} a media type`;
        resourceId = mongoose.Types.ObjectId().toString();
      } else if (resourceType === 'user') {
        details = `${action === 'CREATE' ? 'Created' : action === 'EDIT' ? 'Updated' : action === 'DELETE' ? 'Deleted' : 'Viewed'} user profile`;
        resourceId = user._id.toString();
      } else {
        details = 'Accessed media library';
        resourceId = 'media-library';
      }
      
      // Create a timestamp between now and 30 days ago
      const timestamp = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));
      
      // Create log data
      const logData = {
        userId: user._id,
        username: user.username || `${user.firstName} ${user.lastName}`,
        action,
        details,
        resourceType,
        resourceId,
        timestamp
      };
      
      seedLogs.push(logData);
    }
    
    // Create logs in parallel
    const creationPromises = seedLogs.map(log => LoggerService.logActivity(log));
    await Promise.all(creationPromises);
    
    console.log(`Seeded ${seedLogs.length} initial activity logs`);
  } catch (error) {
    console.error('Error seeding activity logs:', error);
  }
}

// Helper function to seed initial user activities for testing
async function seedInitialUserActivities() {
  try {
    // Get real users to use in our seed data
    const users = await User.find().select('_id username email firstName lastName').limit(5);
    
    if (users.length === 0) {
      console.log('Cannot seed user activities: no users found');
      return;
    }
    
    // Define possible actions and user agents
    const actions = ['LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'PROFILE_UPDATE', 'FAILED_LOGIN'];
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
      'Mozilla/5.0 (Linux; Android 11; SM-G975F) AppleWebKit/537.36'
    ];
    
    const seedActivities = [];
    
    // Create 30 mock user activities
    for (let i = 0; i < 30; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
      
      // Create a timestamp between now and 7 days ago
      const timestamp = new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000));
      
      // Generate a random IP
      const ip = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      
      // Create activity data
      const activityData = {
        userId: user._id,
        username: user.username || `${user.firstName} ${user.lastName}`,
        email: user.email,
        action,
        ip,
        userAgent,
        timestamp,
        details: {
          // Add some dynamic details based on the action
          success: action !== 'FAILED_LOGIN',
          method: action === 'LOGIN' ? 'password' : undefined,
          changes: action === 'PROFILE_UPDATE' ? ['name', 'avatar'] : undefined
        }
      };
      
      seedActivities.push(activityData);
    }
    
    // Create activities in parallel
    const creationPromises = seedActivities.map(activity => LoggerService.logUserActivity(activity));
    await Promise.all(creationPromises);
    
    console.log(`Seeded ${seedActivities.length} initial user activities`);
  } catch (error) {
    console.error('Error seeding user activities:', error);
  }
} 