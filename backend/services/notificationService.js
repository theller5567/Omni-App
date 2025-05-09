import nodemailer from 'nodemailer';
import NotificationSettings from '../models/NotificationSettings.js';
import ActivityLog from '../models/ActivityLog.js';
import User from '../models/User.js';
import LoggerService from './loggerService.js';

/**
 * Service to handle email notifications for activity logs
 */
class NotificationService {
  /**
   * Create email transporter
   * @returns {Object} Nodemailer transporter
   */
  static getTransporter() {
    // For production, replace with actual SMTP configuration
    // For testing/development, we can use the ethereal test account or console logging
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });
    } else {
      // For development, just log emails to console
      return {
        sendMail: async (mailOptions) => {
          console.log('====== DEVELOPMENT EMAIL ======');
          console.log('To:', mailOptions.to);
          console.log('Subject:', mailOptions.subject);
          console.log('Text:', mailOptions.text);
          console.log('==============================');
          return { messageId: 'dev-' + Date.now() };
        }
      };
    }
  }

  /**
   * Check if an activity log should trigger a notification
   * based on the notification settings and rules
   * 
   * @param {Object} activity - The activity log
   * @returns {Promise<boolean>} - Whether notification should be sent
   */
  static async shouldNotify(activity) {
    try {
      return await NotificationSettings.shouldNotify(activity);
    } catch (error) {
      console.error('Error checking if activity should trigger notification:', error);
      return false;
    }
  }

  /**
   * Process a new activity log for potential notification
   * 
   * @param {Object} activity - The activity log
   * @param {Object} user - The user who performed the action (optional)
   * @returns {Promise<void>}
   */
  static async processActivityNotification(activity, user = null) {
    try {
      // Get notification settings
      const settings = await NotificationSettings.findOne({ enabled: true });
      if (!settings) return; // No active notification settings
      
      // Check if activity matches notification rules
      if (!await this.shouldNotify(activity)) return;
      
      // If immediate notification, send right away
      if (settings.frequency === 'immediate') {
        await this.sendActivityNotification(activity, settings);
      }
      
      // Otherwise, the activity is just logged and will be sent in batches
      // by a scheduled job that calls sendBatchNotifications()
    } catch (error) {
      console.error('Error processing activity notification:', error);
    }
  }

  /**
   * Send an immediate notification for an activity
   * 
   * @param {Object} activity - The activity log
   * @param {Object} settings - The notification settings
   * @returns {Promise<void>}
   */
  static async sendActivityNotification(activity, settings) {
    try {
      // Get recipients - removed isActive filter since it's not in the User model
      const recipients = await User.find({ 
        _id: { $in: settings.recipients }
      }).select('email username firstName lastName');
      
      if (recipients.length === 0) return;
      
      // Find matching rule
      const matchingRule = settings.rules.find(rule => {
        if (!rule.enabled) return false;
        
        // Safely check for actionTypes property
        const actionTypes = rule.actionTypes || ['ALL'];
        const matchesAction = actionTypes.includes('ALL') || 
                            actionTypes.includes(activity.action);
        if (!matchesAction) return false;
        
        // Safely check for resourceTypes property
        const resourceTypes = rule.resourceTypes || ['ALL'];
        const matchesResource = resourceTypes.includes('ALL') || 
                              resourceTypes.includes(activity.resourceType);
        if (!matchesResource) return false;
        
        return true;
      });
      
      if (!matchingRule) return;
      
      // Format email content
      const emailContent = this.formatEmailContent(activity, matchingRule);
      
      // Send email to all recipients
      const transporter = this.getTransporter();
      
      for (const recipient of recipients) {
        // Apply throttling if enabled
        if (settings.throttling.enabled) {
          // Check how many emails were sent to this recipient in the last hour
          const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
          const recentEmails = settings.history.filter(h => 
            h.sentAt > hourAgo && 
            h.recipients?.includes(recipient._id.toString())
          ).length;
          
          if (recentEmails >= settings.throttling.maxEmailsPerHour) {
            console.log(`Throttling emails to ${recipient.email}, too many sent recently`);
            continue;
          }
        }
        
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || 'no-reply@omni-app.com',
          to: recipient.email,
          subject: this.formatSubject(activity, matchingRule),
          text: emailContent,
          html: this.formatHtmlContent(activity, matchingRule)
        });
      }
      
      // Update notification history
      settings.history.push({
        sentAt: new Date(),
        recipientCount: recipients.length,
        activityCount: 1,
        recipients: recipients.map(r => r._id.toString())
      });
      
      settings.lastSentAt = new Date();
      await settings.save();
      
    } catch (error) {
      console.error('Error sending activity notification:', error);
    }
  }

  /**
   * Send batch notifications based on frequency
   * 
   * @param {string} frequency - The frequency ('hourly', 'daily', 'weekly')
   * @returns {Promise<void>}
   */
  static async sendBatchNotifications(frequency) {
    try {
      // Find settings matching this frequency
      const settings = await NotificationSettings.findOne({ 
        enabled: true,
        frequency
      });
      
      if (!settings) return;
      
      // Determine time range based on frequency and last sent time
      const timeRange = this.getTimeRangeForFrequency(frequency, settings.lastSentAt);
      
      // Get all activities in that time range
      const { logs: activities } = await LoggerService.getActivityLogs({
        startDate: timeRange.start,
        endDate: timeRange.end,
        limit: 1000 // Cap at a reasonable number
      });
      
      if (activities.length === 0) return;
      
      // Get recipients - removed isActive filter since it's not in the User model
      const recipients = await User.find({ 
        _id: { $in: settings.recipients }
      }).select('email username firstName lastName');
      
      if (recipients.length === 0) return;
      
      // Group activities by matching rule
      const activityGroups = this.groupActivitiesByRule(activities, settings.rules);
      
      // Send one email per rule that has matching activities
      const transporter = this.getTransporter();
      
      for (const [ruleIndex, group] of Object.entries(activityGroups)) {
        if (group.activities.length === 0) continue;
        
        const rule = settings.rules[ruleIndex];
        
        // Format email for this group
        const subject = `[Omni-App] ${this.getFrequencyText(frequency)} Activity Summary`;
        const emailContent = this.formatBatchEmailContent(group.activities, rule, frequency);
        const htmlContent = this.formatBatchHtmlContent(group.activities, rule, frequency);
        
        // Send to all recipients
        for (const recipient of recipients) {
          await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'no-reply@omni-app.com',
            to: recipient.email,
            subject,
            text: emailContent,
            html: htmlContent
          });
        }
      }
      
      // Update notification history
      settings.history.push({
        sentAt: new Date(),
        recipientCount: recipients.length,
        activityCount: activities.length
      });
      
      settings.lastSentAt = new Date();
      await settings.save();
      
    } catch (error) {
      console.error(`Error sending ${frequency} batch notifications:`, error);
    }
  }

  /**
   * Get time range for a frequency
   * 
   * @param {string} frequency - The frequency ('hourly', 'daily', 'weekly')
   * @param {Date} lastSentAt - When the last notification was sent
   * @returns {Object} - The start and end times for the range
   */
  static getTimeRangeForFrequency(frequency, lastSentAt) {
    const end = new Date();
    let start;
    
    if (lastSentAt) {
      // Use the last sent time as the starting point
      start = new Date(lastSentAt);
    } else {
      // If never sent before, use a default range based on frequency
      switch (frequency) {
        case 'hourly':
          start = new Date(end.getTime() - 1 * 60 * 60 * 1000); // 1 hour ago
          break;
        case 'daily':
          start = new Date(end.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
          break;
        case 'weekly':
          start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
          break;
        default:
          start = new Date(end.getTime() - 24 * 60 * 60 * 1000); // Default to 24 hours
      }
    }
    
    return { start, end };
  }

  /**
   * Group activities by which rule they match
   * 
   * @param {Array} activities - The activity logs
   * @param {Array} rules - The notification rules
   * @returns {Object} - Activities grouped by rule index
   */
  static groupActivitiesByRule(activities, rules) {
    const groups = {};
    
    // Initialize groups for each rule
    rules.forEach((_, index) => {
      groups[index] = { activities: [] };
    });
    
    // Assign each activity to matching rules
    activities.forEach(activity => {
      rules.forEach((rule, index) => {
        if (!rule.enabled) return;
        
        // Safely check for actionTypes property
        const actionTypes = rule.actionTypes || ['ALL'];
        const matchesAction = actionTypes.includes('ALL') || 
                            actionTypes.includes(activity.action);
        if (!matchesAction) return;
        
        // Safely check for resourceTypes property
        const resourceTypes = rule.resourceTypes || ['ALL'];
        const matchesResource = resourceTypes.includes('ALL') || 
                              resourceTypes.includes(activity.resourceType);
        if (!matchesResource) return;
        
        // Activity matches this rule
        groups[index].activities.push(activity);
      });
    });
    
    return groups;
  }

  /**
   * Format subject line for notification
   * 
   * @param {Object} activity - The activity log
   * @param {Object} rule - The notification rule
   * @returns {string} - Formatted subject
   */
  static formatSubject(activity, rule) {
    let subject = rule.subjectTemplate || '[Omni-App] Activity Notification: {{action}} {{resourceType}}';
    
    // Replace placeholders
    subject = subject.replace('{{action}}', activity.action);
    subject = subject.replace('{{resourceType}}', activity.resourceType);
    subject = subject.replace('{{username}}', activity.username);
    
    return subject;
  }

  /**
   * Format plain text email content for single activity
   * 
   * @param {Object} activity - The activity log
   * @param {Object} rule - The notification rule
   * @returns {string} - Formatted email content
   */
  static formatEmailContent(activity, rule) {
    const timestamp = new Date(activity.timestamp).toLocaleString();
    
    let content = `
Activity Notification from Omni-App
------------------------------------

An action was performed that matches your notification rules:

Action: ${activity.action}
Resource: ${activity.resourceType}
Performed by: ${activity.username}
Time: ${timestamp}

Details: ${activity.details}
`;

    // Add link if it's a media resource with a slug
    if (activity.resourceType === 'media' && activity.mediaSlug) {
      content += `\nView in app: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/media/slug/${activity.mediaSlug}`;
    }
    
    return content;
  }

  /**
   * Format HTML email content for single activity
   * 
   * @param {Object} activity - The activity log
   * @param {Object} rule - The notification rule
   * @returns {string} - Formatted HTML email content
   */
  static formatHtmlContent(activity, rule) {
    const timestamp = new Date(activity.timestamp).toLocaleString();
    
    let content = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4dabf5; color: white; padding: 10px 20px; border-radius: 5px 5px 0 0; }
    .content { border: 1px solid #ddd; border-top: none; padding: 20px; border-radius: 0 0 5px 5px; }
    .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
    .action { font-weight: bold; color: #4dabf5; }
    .field { margin-bottom: 10px; }
    .label { font-weight: bold; width: 100px; display: inline-block; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Activity Notification</h2>
    </div>
    <div class="content">
      <p>An action was performed that matches your notification rules:</p>
      
      <div class="field">
        <span class="label">Action:</span>
        <span class="action">${activity.action}</span>
      </div>
      
      <div class="field">
        <span class="label">Resource:</span>
        <span>${activity.resourceType}</span>
      </div>
      
      <div class="field">
        <span class="label">Performed by:</span>
        <span>${activity.username}</span>
      </div>
      
      <div class="field">
        <span class="label">Time:</span>
        <span>${timestamp}</span>
      </div>
      
      <div class="field">
        <span class="label">Details:</span>
        <span>${activity.details}</span>
      </div>
`;

    // Add link if it's a media resource with a slug
    if (activity.resourceType === 'media' && activity.mediaSlug) {
      content += `
      <div class="field" style="margin-top: 20px;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/media/slug/${activity.mediaSlug}" 
           style="background-color: #4dabf5; color: white; padding: 8px 15px; text-decoration: none; border-radius: 3px;">
          View in App
        </a>
      </div>
`;
    }
    
    content += `
    </div>
    <div class="footer">
      <p>This is an automated message from Omni-App. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;
    
    return content;
  }

  /**
   * Format plain text email content for batch notifications
   * 
   * @param {Array} activities - The activity logs
   * @param {Object} rule - The notification rule
   * @param {string} frequency - The frequency
   * @returns {string} - Formatted email content
   */
  static formatBatchEmailContent(activities, rule, frequency) {
    const period = this.getFrequencyText(frequency);
    
    let content = `
${period} Activity Summary from Omni-App
${'-'.repeat(period.length + 30)}

This is a summary of activities performed in the last ${period.toLowerCase()}:

`;

    // Group by action type
    const actionGroups = {};
    activities.forEach(activity => {
      if (!actionGroups[activity.action]) {
        actionGroups[activity.action] = [];
      }
      actionGroups[activity.action].push(activity);
    });
    
    // Format each action group
    Object.entries(actionGroups).forEach(([action, acts]) => {
      content += `\n${action} Actions (${acts.length}):\n`;
      content += `${'-'.repeat(action.length + 15)}\n`;
      
      acts.slice(0, 10).forEach(activity => {
        const timestamp = new Date(activity.timestamp).toLocaleString();
        content += `• ${timestamp}: ${activity.details} (by ${activity.username})\n`;
      });
      
      if (acts.length > 10) {
        content += `... and ${acts.length - 10} more ${action} actions\n`;
      }
    });
    
    content += `\n\nView all activity in the Admin Dashboard: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/activity`;
    
    return content;
  }

  /**
   * Format HTML email content for batch notifications
   * 
   * @param {Array} activities - The activity logs
   * @param {Object} rule - The notification rule
   * @param {string} frequency - The frequency
   * @returns {string} - Formatted HTML email content
   */
  static formatBatchHtmlContent(activities, rule, frequency) {
    const period = this.getFrequencyText(frequency);
    
    let content = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #4dabf5; color: white; padding: 10px 20px; border-radius: 5px 5px 0 0; }
    .content { border: 1px solid #ddd; border-top: none; padding: 20px; border-radius: 0 0 5px 5px; }
    .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
    .action-group { margin-bottom: 20px; }
    .action-header { font-weight: bold; color: #4dabf5; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px; }
    .activity-item { margin-bottom: 8px; }
    .timestamp { color: #888; font-size: 12px; }
    .view-all { margin-top: 30px; text-align: center; }
    .view-btn { background-color: #4dabf5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>${period} Activity Summary</h2>
    </div>
    <div class="content">
      <p>This is a summary of activities performed in the last ${period.toLowerCase()}:</p>
`;

    // Group by action type
    const actionGroups = {};
    activities.forEach(activity => {
      if (!actionGroups[activity.action]) {
        actionGroups[activity.action] = [];
      }
      actionGroups[activity.action].push(activity);
    });
    
    // Format each action group
    Object.entries(actionGroups).forEach(([action, acts]) => {
      content += `
      <div class="action-group">
        <div class="action-header">${action} Actions (${acts.length})</div>
`;
      
      acts.slice(0, 10).forEach(activity => {
        const timestamp = new Date(activity.timestamp).toLocaleString();
        content += `
        <div class="activity-item">
          • <span class="timestamp">${timestamp}:</span> ${activity.details} (by ${activity.username})
        </div>
`;
      });
      
      if (acts.length > 10) {
        content += `
        <div class="activity-item">
          ... and ${acts.length - 10} more ${action} actions
        </div>
`;
      }
      
      content += `
      </div>
`;
    });
    
    content += `
      <div class="view-all">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin/activity" class="view-btn">
          View All Activity
        </a>
      </div>
    </div>
    <div class="footer">
      <p>This is an automated message from Omni-App. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;
    
    return content;
  }

  /**
   * Get human-readable text for frequency
   * 
   * @param {string} frequency - The frequency
   * @returns {string} - Human-readable frequency text
   */
  static getFrequencyText(frequency) {
    switch (frequency) {
      case 'hourly': return 'Hourly';
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      default: return 'Periodic';
    }
  }
}

export default NotificationService; 