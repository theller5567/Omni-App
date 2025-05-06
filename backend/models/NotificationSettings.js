import mongoose from 'mongoose';

/**
 * Schema for notification rule configuration
 * Each rule defines criteria for when to send notifications
 */
const notificationRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  enabled: {
    type: Boolean,
    default: true
  },
  // Filter by action types (UPLOAD, DELETE, EDIT, etc.)
  actionTypes: {
    type: [String],
    enum: ['UPLOAD', 'DELETE', 'EDIT', 'CREATE', 'VIEW', 'ALL'],
    default: ['ALL']
  },
  // Filter by resource types (media, mediaType, user, etc.)
  resourceTypes: {
    type: [String],
    enum: ['media', 'mediaType', 'user', 'system', 'tag', 'tagCategory', 'ALL'],
    default: ['ALL']
  },
  // Filter by roles of users who performed the action
  triggerRoles: {
    type: [String],
    enum: ['admin', 'user', 'superAdmin', 'ALL'],
    default: ['ALL']
  },
  // Filter by specific users who performed the action (optional)
  triggerUserIds: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: []
  },
  // Priority level for notification
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  },
  // Include specific fields in the notification
  includeDetails: {
    type: Boolean,
    default: true
  },
  // Email subject template
  subjectTemplate: {
    type: String,
    default: '[Omni-App] Activity Notification: {{action}} {{resourceType}}'
  }
}, { _id: true });

/**
 * Schema for notification settings
 * This controls when and how activity log emails are sent
 */
const notificationSettingsSchema = new mongoose.Schema({
  // Notification is active/inactive
  enabled: {
    type: Boolean,
    default: false
  },
  // User IDs of admins who should receive notifications
  recipients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  // How often to send notifications
  frequency: {
    type: String,
    enum: ['immediate', 'hourly', 'daily', 'weekly'],
    default: 'immediate'
  },
  // When sending batched notifications, what time of day
  // Format: "HH:MM" in 24h format
  scheduledTime: {
    type: String,
    default: '09:00',
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: props => `${props.value} is not a valid time format. Use HH:MM.`
    }
  },
  // Collection of notification rules
  rules: {
    type: [notificationRuleSchema],
    default: []
  },
  // Last time notifications were sent (used for batching)
  lastSentAt: {
    type: Date,
    default: null
  },
  // Track notification history for debugging
  history: [{
    sentAt: Date,
    recipientCount: Number,
    activityCount: Number
  }],
  // If throttling is needed to prevent too many emails
  throttling: {
    maxEmailsPerHour: {
      type: Number,
      default: 10
    },
    enabled: {
      type: Boolean,
      default: true
    }
  }
}, { timestamps: true });

// Add indexes for better performance
notificationSettingsSchema.index({ enabled: 1 });
notificationSettingsSchema.index({ frequency: 1 });
notificationSettingsSchema.index({ 'rules.enabled': 1 });
notificationSettingsSchema.index({ 'rules.actionTypes': 1 });
notificationSettingsSchema.index({ 'rules.resourceTypes': 1 });

// Default rule creation for new settings
notificationSettingsSchema.pre('save', function(next) {
  // If this is a new document and has no rules, create a default rule
  if (this.isNew && this.rules.length === 0) {
    this.rules.push({
      name: 'Default Rule',
      enabled: true,
      actionTypes: ['CREATE', 'DELETE'],
      resourceTypes: ['ALL'],
      triggerRoles: ['ALL'],
      priority: 'normal',
      includeDetails: true
    });
  }
  next();
});

// Create a static method to check if an activity should trigger notification
notificationSettingsSchema.statics.shouldNotify = async function(activity) {
  // Get active notification settings
  const settings = await this.findOne({ enabled: true }).exec();
  if (!settings) return false;
  
  // Check each rule to see if the activity matches
  for (const rule of settings.rules) {
    if (!rule.enabled) continue;
    
    // Check action type
    const matchesAction = rule.actionTypes.includes('ALL') || 
                         rule.actionTypes.includes(activity.action);
    if (!matchesAction) continue;
    
    // Check resource type
    const matchesResource = rule.resourceTypes.includes('ALL') || 
                           rule.resourceTypes.includes(activity.resourceType);
    if (!matchesResource) continue;
    
    // Check user role (would need to be passed or looked up)
    // This is a simplified version, you'd need to get the user's role
    if (activity.userRole && !rule.triggerRoles.includes('ALL') && 
        !rule.triggerRoles.includes(activity.userRole)) {
      continue;
    }
    
    // Check specific users
    if (rule.triggerUserIds.length > 0 && 
        !rule.triggerUserIds.includes(activity.userId)) {
      continue;
    }
    
    // If we got here, all conditions matched
    return true;
  }
  
  // No matching rules found
  return false;
};

const NotificationSettings = mongoose.model('NotificationSettings', notificationSettingsSchema);

export default NotificationSettings; 