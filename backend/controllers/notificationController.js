import NotificationSettings from '../models/NotificationSettings.js';
import User from '../models/User.js';
import NotificationService from '../services/notificationService.js';

/**
 * Get notification settings
 * @route GET /api/admin/notification-settings
 * @access Private (superAdmin)
 */
export const getNotificationSettings = async (req, res) => {
  try {
    // Check if settings exist
    let settings = await NotificationSettings.findOne().populate('recipients', 'username email firstName lastName');
    
    // If no settings exist, create default settings
    if (!settings) {
      const superAdmins = await User.find({ role: 'superAdmin', isActive: true }).select('_id');
      
      settings = await NotificationSettings.create({
        enabled: false,
        recipients: superAdmins.map(admin => admin._id),
        frequency: 'daily',
        rules: [{
          name: 'Default Rule',
          enabled: true,
          actionTypes: ['CREATE', 'DELETE'],
          resourceTypes: ['ALL'],
          triggerRoles: ['ALL'],
          priority: 'normal',
          includeDetails: true
        }]
      });
      
      // Populate the recipients field after creation
      settings = await NotificationSettings.findById(settings._id)
        .populate('recipients', 'username email firstName lastName');
    }
    
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error getting notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification settings',
      error: error.message
    });
  }
};

/**
 * Update notification settings
 * @route PUT /api/admin/notification-settings
 * @access Private (superAdmin)
 */
export const updateNotificationSettings = async (req, res) => {
  try {
    const { enabled, recipients, frequency, scheduledTime, rules, throttling } = req.body;
    
    // Find existing settings or create new
    let settings = await NotificationSettings.findOne();
    
    if (!settings) {
      settings = new NotificationSettings();
    }
    
    // Update settings with provided data
    if (enabled !== undefined) settings.enabled = enabled;
    if (recipients) settings.recipients = recipients;
    if (frequency) settings.frequency = frequency;
    if (scheduledTime) settings.scheduledTime = scheduledTime;
    if (throttling) settings.throttling = throttling;
    
    // Update rules if provided
    if (rules) {
      settings.rules = rules;
    }
    
    // Save updated settings
    await settings.save();
    
    // Return updated settings with populated recipients
    const updatedSettings = await NotificationSettings.findById(settings._id)
      .populate('recipients', 'username email firstName lastName');
    
    res.status(200).json({
      success: true,
      message: 'Notification settings updated successfully',
      data: updatedSettings
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification settings',
      error: error.message
    });
  }
};

/**
 * Add a new notification rule
 * @route POST /api/admin/notification-settings/rules
 * @access Private (superAdmin)
 */
export const addNotificationRule = async (req, res) => {
  try {
    const { name, enabled, actionTypes, resourceTypes, triggerRoles, triggerUserIds, priority, includeDetails, subjectTemplate } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Rule name is required'
      });
    }
    
    // Find settings or create if they don't exist
    let settings = await NotificationSettings.findOne();
    if (!settings) {
      const superAdmins = await User.find({ role: 'superAdmin', isActive: true }).select('_id');
      settings = new NotificationSettings({
        enabled: false,
        recipients: superAdmins.map(admin => admin._id),
        frequency: 'daily'
      });
    }
    
    // Create new rule
    const newRule = {
      name,
      enabled: enabled !== undefined ? enabled : true,
      actionTypes: actionTypes || ['ALL'],
      resourceTypes: resourceTypes || ['ALL'],
      triggerRoles: triggerRoles || ['ALL'],
      triggerUserIds: triggerUserIds || [],
      priority: priority || 'normal',
      includeDetails: includeDetails !== undefined ? includeDetails : true,
      subjectTemplate: subjectTemplate || '[Omni-App] Activity Notification: {{action}} {{resourceType}}'
    };
    
    // Add rule to settings
    settings.rules.push(newRule);
    await settings.save();
    
    res.status(201).json({
      success: true,
      message: 'Notification rule added successfully',
      data: newRule
    });
  } catch (error) {
    console.error('Error adding notification rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add notification rule',
      error: error.message
    });
  }
};

/**
 * Update a notification rule
 * @route PUT /api/admin/notification-settings/rules/:ruleId
 * @access Private (superAdmin)
 */
export const updateNotificationRule = async (req, res) => {
  try {
    const { ruleId } = req.params;
    
    // Find settings
    const settings = await NotificationSettings.findOne();
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Notification settings not found'
      });
    }
    
    // Find rule index
    const ruleIndex = settings.rules.findIndex(rule => rule._id.toString() === ruleId);
    if (ruleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Rule not found'
      });
    }
    
    // Update rule fields
    const rule = settings.rules[ruleIndex];
    const { name, enabled, actionTypes, resourceTypes, triggerRoles, triggerUserIds, priority, includeDetails, subjectTemplate } = req.body;
    
    if (name) rule.name = name;
    if (enabled !== undefined) rule.enabled = enabled;
    if (actionTypes) rule.actionTypes = actionTypes;
    if (resourceTypes) rule.resourceTypes = resourceTypes;
    if (triggerRoles) rule.triggerRoles = triggerRoles;
    if (triggerUserIds) rule.triggerUserIds = triggerUserIds;
    if (priority) rule.priority = priority;
    if (includeDetails !== undefined) rule.includeDetails = includeDetails;
    if (subjectTemplate) rule.subjectTemplate = subjectTemplate;
    
    // Save updated settings
    await settings.save();
    
    res.status(200).json({
      success: true,
      message: 'Notification rule updated successfully',
      data: rule
    });
  } catch (error) {
    console.error('Error updating notification rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification rule',
      error: error.message
    });
  }
};

/**
 * Delete a notification rule
 * @route DELETE /api/admin/notification-settings/rules/:ruleId
 * @access Private (superAdmin)
 */
export const deleteNotificationRule = async (req, res) => {
  try {
    const { ruleId } = req.params;
    
    // Find settings
    const settings = await NotificationSettings.findOne();
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Notification settings not found'
      });
    }
    
    // Find rule index
    const ruleIndex = settings.rules.findIndex(rule => rule._id.toString() === ruleId);
    if (ruleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Rule not found'
      });
    }
    
    // Remove rule
    settings.rules.splice(ruleIndex, 1);
    await settings.save();
    
    res.status(200).json({
      success: true,
      message: 'Notification rule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification rule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification rule',
      error: error.message
    });
  }
};

/**
 * Get eligible admin users for notifications
 * @route GET /api/admin/notification-settings/eligible-recipients
 * @access Private (superAdmin)
 */
export const getEligibleRecipients = async (req, res) => {
  try {
    console.log('Getting eligible recipients, user:', req.user);
    
    // Get all admin and superAdmin users - removed isActive filter since it's not in the User model
    const adminUsers = await User.find({ 
      role: { $in: ['admin', 'superAdmin'] }
    }).select('_id username email firstName lastName role');
    
    console.log(`Found ${adminUsers.length} eligible recipients:`, 
      adminUsers.map(u => ({ 
        id: u._id, 
        email: u.email, 
        username: u.username, 
        role: u.role 
      }))
    );
    
    // If no admin users found, create a default response with logged-in user
    if (adminUsers.length === 0 && req.user) {
      console.log('No admin users found, including current user as fallback');
      const currentUser = await User.findById(req.user.id)
        .select('_id username email firstName lastName role');
      
      if (currentUser) {
        adminUsers.push(currentUser);
      }
    }
    
    res.status(200).json({
      success: true,
      data: adminUsers
    });
  } catch (error) {
    console.error('Error getting eligible recipients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get eligible recipients',
      error: error.message
    });
  }
};

/**
 * Send a test notification
 * @route POST /api/admin/notification-settings/test
 * @access Private (superAdmin)
 */
export const sendTestNotification = async (req, res) => {
  try {
    const { recipients } = req.body;
    
    // Create a mock activity
    const mockActivity = {
      action: 'TEST',
      details: 'This is a test notification',
      resourceType: 'system',
      resourceId: 'test',
      username: req.user.username || req.user.email || 'System',
      userId: req.user._id,
      timestamp: new Date(),
      userRole: req.user.role
    };
    
    // Create a mock settings object
    const mockSettings = {
      recipients: recipients || [req.user._id],
      throttling: { enabled: false },
      history: [],
      lastSentAt: null,
      save: async () => {}
    };
    
    // Create a mock rule with all necessary properties
    const mockRule = {
      name: 'Test Rule',
      enabled: true,
      includeDetails: true,
      subjectTemplate: '[Omni-App] Test Notification',
      actionTypes: ['ALL', 'TEST'],
      resourceTypes: ['ALL', 'system'],
      triggerRoles: ['ALL']
    };
    
    // Send the test notification
    await NotificationService.sendActivityNotification(mockActivity, {
      ...mockSettings,
      rules: [mockRule]
    });
    
    res.status(200).json({
      success: true,
      message: 'Test notification sent successfully'
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
      error: error.message
    });
  }
}; 