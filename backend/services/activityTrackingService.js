import LoggerService from './loggerService.js';
import NotificationService from './notificationService.js';
import User from '../models/User.js';

/**
 * Service for tracking activities throughout the application
 * This provides a consistent way to log activities across different controllers
 */
class ActivityTrackingService {
  /**
   * Track a media upload
   * 
   * @param {Object} user - The user who uploaded the media
   * @param {Object} media - The uploaded media object
   */
  static async trackMediaUpload(user, media) {
    if (!user || !media) return;
    
    const mediaTitle = media.title || 'Untitled';
    console.log('ActivityTrackingService: Logging media upload with mediaTitle:', mediaTitle);
    const activity = await LoggerService.logActivity({
      userId: user.id,
      username: user.username || user.email,
      action: 'UPLOAD',
      details: `Uploaded media file: ${mediaTitle}`,
      resourceType: 'media',
      resourceId: media.id || media._id,
      mediaSlug: media.slug,
      mediaTitle
    });
    
    // Process notification
    if (activity) {
      // Add user role
      const userRole = await this.getUserRole(user.id);
      activity.userRole = userRole;
      
      await NotificationService.processActivityNotification(activity, user);
    }
  }
  
  /**
   * Track a media deletion
   * 
   * @param {Object} user - The user who deleted the media
   * @param {Object} media - The deleted media object
   */
  static async trackMediaDeletion(user, media) {
    if (!user || !media) return;
    
    const mediaTitle = media.title || 'Untitled';
    console.log('ActivityTrackingService: Logging media deletion with mediaTitle:', mediaTitle);
    const activity = await LoggerService.logActivity({
      userId: user.id,
      username: user.username || user.email,
      action: 'DELETE',
      details: `Deleted media file: ${mediaTitle}`,
      resourceType: 'media',
      resourceId: media.id || media._id,
      mediaSlug: media.slug,
      mediaTitle
    });
    
    // Process notification
    if (activity) {
      // Add user role
      const userRole = await this.getUserRole(user.id);
      activity.userRole = userRole;
      
      await NotificationService.processActivityNotification(activity, user);
    }
  }
  
  /**
   * Track a media update
   * 
   * @param {Object} user - The user who updated the media
   * @param {Object} media - The updated media object
   * @param {Array} changedFields - Array of field names that were changed
   */
  static async trackMediaUpdate(user, media, changedFields = []) {
    if (!user || !media) return;
    
    const mediaTitle = media.title || 'Untitled';
    console.log('ActivityTrackingService: Logging media update with mediaTitle:', mediaTitle);
    const activity = await LoggerService.logActivity({
      userId: user.id,
      username: user.username || user.email,
      action: 'EDIT',
      details: `Updated media file: ${mediaTitle} (${changedFields.join(', ')})`,
      resourceType: 'media',
      resourceId: media.id || media._id,
      mediaSlug: media.slug,
      mediaTitle
    });
    
    // Process notification
    if (activity) {
      // Add user role
      const userRole = await this.getUserRole(user.id);
      activity.userRole = userRole;
      
      await NotificationService.processActivityNotification(activity, user);
    }
  }
  
  /**
   * Track a media type creation
   * 
   * @param {Object} user - The user who created the media type
   * @param {Object} mediaType - The created media type
   */
  static async trackMediaTypeCreation(user, mediaType) {
    if (!user || !mediaType) return;
    
    const activity = await LoggerService.logActivity({
      userId: user.id,
      username: user.username || user.email,
      action: 'CREATE',
      details: `Created media type: ${mediaType.name}`,
      resourceType: 'mediaType',
      resourceId: mediaType._id || mediaType.id
    });
    
    // Process notification
    if (activity) {
      // Add user role
      const userRole = await this.getUserRole(user.id);
      activity.userRole = userRole;
      
      await NotificationService.processActivityNotification(activity, user);
    }
  }
  
  /**
   * Track a media type update
   * 
   * @param {Object} user - The user who updated the media type
   * @param {Object} mediaType - The updated media type
   */
  static async trackMediaTypeUpdate(user, mediaType) {
    if (!user || !mediaType) return;
    
    const activity = await LoggerService.logActivity({
      userId: user.id,
      username: user.username || user.email,
      action: 'EDIT',
      details: `Updated media type: ${mediaType.name}`,
      resourceType: 'mediaType',
      resourceId: mediaType._id || mediaType.id
    });
    
    // Process notification
    if (activity) {
      // Add user role
      const userRole = await this.getUserRole(user.id);
      activity.userRole = userRole;
      
      await NotificationService.processActivityNotification(activity, user);
    }
  }
  
  /**
   * Track a media type deletion
   * 
   * @param {Object} user - The user who deleted the media type
   * @param {Object} mediaType - The deleted media type
   */
  static async trackMediaTypeDeletion(user, mediaType) {
    if (!user || !mediaType) return;
    
    const activity = await LoggerService.logActivity({
      userId: user.id,
      username: user.username || user.email,
      action: 'DELETE',
      details: `Deleted media type: ${mediaType.name}`,
      resourceType: 'mediaType',
      resourceId: mediaType._id || mediaType.id
    });
    
    // Process notification
    if (activity) {
      // Add user role
      const userRole = await this.getUserRole(user.id);
      activity.userRole = userRole;
      
      await NotificationService.processActivityNotification(activity, user);
    }
  }

  /**
   * Track a tag creation
   * 
   * @param {Object} user - The user who created the tag
   * @param {Object} tag - The created tag
   */
  static async trackTagCreation(user, tag) {
    if (!user || !tag) return;
    
    const activity = await LoggerService.logActivity({
      userId: user.id,
      username: user.username || user.email,
      action: 'CREATE',
      details: `Created tag: ${tag.name}`,
      resourceType: 'tag',
      resourceId: tag._id || tag.id,
      tagId: tag._id || tag.id,
      tagName: tag.name
    }); 

    if (activity) {
      // Add user role
      const userRole = await this.getUserRole(user.id);
      activity.userRole = userRole;
      
      await NotificationService.processActivityNotification(activity, user);
    }
  }

  /**
   * Track a tag deletion
   * 
   * @param {Object} user - The user who deleted the tag
   * @param {Object} tag - The deleted tag
   */
  static async trackTagDeletion(user, tag) {
    if (!user || !tag) return;
    
    const activity = await LoggerService.logActivity({
      userId: user.id,
      username: user.username || user.email,
      action: 'DELETE', 
      details: `Deleted tag: ${tag.name}`,
      resourceType: 'tag',
      resourceId: tag._id || tag.id,
      tagId: tag._id || tag.id,
      tagName: tag.name
    });
    
    if (activity) {
      // Add user role
      const userRole = await this.getUserRole(user.id);
      activity.userRole = userRole;
      
      await NotificationService.processActivityNotification(activity, user);
    }
  }
  
  /**
   * Track a tag update
   * 
   * @param {Object} user - The user who updated the tag
   * @param {Object} tag - The updated tag
   * @param {Array} changedFields - Fields that were changed
   */
  static async trackTagUpdate(user, tag, changedFields = []) {
    if (!user || !tag) return;
    
    const activity = await LoggerService.logActivity({
      userId: user.id,
      username: user.username || user.email,
      action: 'EDIT',
      details: `Updated tag: ${tag.name} (${changedFields.join(', ')})`,
      resourceType: 'tag',
      resourceId: tag._id || tag.id,
      tagId: tag._id || tag.id,
      tagName: tag.name
    });
    
    if (activity) {
      // Add user role
      const userRole = await this.getUserRole(user.id);
      activity.userRole = userRole;
      
      await NotificationService.processActivityNotification(activity, user);
    }
  }

  /**
   * Track a tag category creation
   * 
   * @param {Object} user - The user who created the tag category
   * @param {Object} tagCategory - The created tag category
   * @param {Array} tags - Associated tags, if available
   */
  static async trackTagCategoryCreation(user, tagCategory, tags = []) {
    if (!user || !tagCategory) return;
    
    // Format tags information if available
    let detailsText = `Created tag category: ${tagCategory.name}`;
    if (tags && tags.length > 0) {
      const tagNames = tags.map(tag => tag.name || 'Unnamed tag').join(', ');
      detailsText += ` containing tags: ${tagNames}`;
    }
    
    const activity = await LoggerService.logActivity({
      userId: user.id,
      username: user.username || user.email,
      action: 'CREATE',
      details: detailsText,
      resourceType: 'tagCategory',
      resourceId: tagCategory._id || tagCategory.id,
      tagCategoryId: tagCategory._id || tagCategory.id,
      tagCategoryName: tagCategory.name
    });
    
    if (activity) {
      // Add user role
      const userRole = await this.getUserRole(user.id);
      activity.userRole = userRole;
      
      await NotificationService.processActivityNotification(activity, user);
    }
  }
  
  /**
   * Track a tag category update
   * 
   * @param {Object} user - The user who updated the tag category
   * @param {Object} tagCategory - The updated tag category
   * @param {Array} changedFields - Fields that were changed
   * @param {Array} tags - Associated tags, if available
   */
  static async trackTagCategoryUpdate(user, tagCategory, changedFields = [], tags = []) {
    if (!user || !tagCategory) return;
    
    // Format tags information if available
    let detailsText = `Updated tag category: ${tagCategory.name} (${changedFields.join(', ')})`;
    if (tags && tags.length > 0) {
      const tagNames = tags.map(tag => tag.name || 'Unnamed tag').join(', ');
      detailsText += ` - Contains tags: ${tagNames}`;
    }
    
    const activity = await LoggerService.logActivity({
      userId: user.id,
      username: user.username || user.email,
      action: 'EDIT',
      details: detailsText,
      resourceType: 'tagCategory',
      resourceId: tagCategory._id || tagCategory.id,
      tagCategoryId: tagCategory._id || tagCategory.id,
      tagCategoryName: tagCategory.name
    });
    
    if (activity) {
      // Add user role
      const userRole = await this.getUserRole(user.id);
      activity.userRole = userRole;
      
      await NotificationService.processActivityNotification(activity, user);
    }
  }
  
  /**
   * Track a tag category deletion
   * 
   * @param {Object} user - The user who deleted the tag category
   * @param {Object} tagCategory - The deleted tag category
   * @param {Array} tags - The tags that were in the category, if available
   */
  static async trackTagCategoryDeletion(user, tagCategory, tags = []) {
    if (!user || !tagCategory) return;
    
    // Format tags information if available
    let detailsText = `Deleted tag category: ${tagCategory.name}`;
    if (tags && tags.length > 0) {
      const tagNames = tags.map(tag => tag.name || 'Unnamed tag').join(', ');
      detailsText += ` containing tags: ${tagNames}`;
    }
    
    const activity = await LoggerService.logActivity({
      userId: user.id,
      username: user.username || user.email,
      action: 'DELETE',
      details: detailsText,
      resourceType: 'tagCategory',
      resourceId: tagCategory._id || tagCategory.id,
      tagCategoryId: tagCategory._id || tagCategory.id,
      tagCategoryName: tagCategory.name
    });
    
    if (activity) {
      // Add user role
      const userRole = await this.getUserRole(user.id);
      activity.userRole = userRole;
      
      await NotificationService.processActivityNotification(activity, user);
    }
  }
  
  /**
   * Track a user profile update
   * 
   * @param {Object} actor - The user performing the update
   * @param {Object} targetUser - The user being updated
   * @param {Array} changedFields - Fields that were changed
   */
  static async trackUserUpdate(actor, targetUser, changedFields = []) {
    if (!actor || !targetUser) return;
    
    const activity = await LoggerService.logActivity({
      userId: actor.id,
      username: actor.username || actor.email,
      action: 'EDIT',
      details: `Updated user profile for ${targetUser.username || targetUser.email} (${changedFields.join(', ')})`,
      resourceType: 'user',
      resourceId: targetUser._id || targetUser.id
    });
    
    // Process notification
    if (activity) {
      // Add user role
      const userRole = await this.getUserRole(actor.id);
      activity.userRole = userRole;
      
      await NotificationService.processActivityNotification(activity, actor);
    }
    
    // If the user is updating their own profile, also log a user activity
    if (actor.id === (targetUser._id || targetUser.id)) {
      const ip = actor.ip || '0.0.0.0';
      const userAgent = actor.userAgent || 'Unknown';
      
      await LoggerService.logUserActivity({
        userId: actor.id,
        username: actor.username || actor.email,
        email: actor.email,
        action: 'PROFILE_UPDATE',
        ip,
        userAgent,
        details: {
          changes: changedFields
        }
      });
    }
  }
  
  /**
   * Track a user creation
   * 
   * @param {Object} actor - The user performing the creation (admin)
   * @param {Object} newUser - The newly created user
   */
  static async trackUserCreation(actor, newUser) {
    if (!actor || !newUser) return;
    
    const activity = await LoggerService.logActivity({
      userId: actor.id,
      username: actor.username || actor.email,
      action: 'CREATE',
      details: `Created new user account: ${newUser.username || newUser.email}`,
      resourceType: 'user',
      resourceId: newUser._id || newUser.id
    });
    
    // Process notification
    if (activity) {
      // Add user role
      const userRole = await this.getUserRole(actor.id);
      activity.userRole = userRole;
      
      await NotificationService.processActivityNotification(activity, actor);
    }
  }
  
  /**
   * Track a password change
   * 
   * @param {Object} user - The user who changed their password
   * @param {string} ip - IP address
   * @param {string} userAgent - User agent
   */
  static async trackPasswordChange(user, ip = '0.0.0.0', userAgent = 'Unknown') {
    if (!user) return;
    
    // Log as a user activity
    await LoggerService.logUserActivity({
      userId: user.id,
      username: user.username || user.email,
      email: user.email,
      action: 'PASSWORD_CHANGE',
      ip,
      userAgent,
      details: {
        success: true
      }
    });
    
    // Also log as a general activity
    const activity = await LoggerService.logActivity({
      userId: user.id,
      username: user.username || user.email,
      action: 'EDIT',
      details: `Changed password`,
      resourceType: 'user',
      resourceId: user.id
    });
    
    // Process notification
    if (activity) {
      // Add user role
      const userRole = await this.getUserRole(user.id);
      activity.userRole = userRole;
      
      await NotificationService.processActivityNotification(activity, user);
    }
  }
  
  /**
   * Track a failed login attempt
   * 
   * @param {string} email - The email that was used
   * @param {string} ip - IP address
   * @param {string} userAgent - User agent
   */
  static async trackFailedLogin(email, ip = '0.0.0.0', userAgent = 'Unknown') {
    if (!email) return;
    
    // Look up the user record (optional)
    let username = email;
    let userRecord = null;
    try {
      userRecord = await User.findOne({ email }).select('_id username email');
      if (userRecord && userRecord.username) {
        username = userRecord.username;
      }
    } catch (_e) {
      // Ignore lookup errors for logging
    }

    // Build payload without invalid ObjectId when user not found
    const activityPayload = {
      username,
      email,
      action: 'FAILED_LOGIN',
      ip,
      userAgent,
      details: { success: false }
    };
    if (userRecord && userRecord._id) {
      // Only include userId when valid
      activityPayload.userId = userRecord._id;
    }
    await LoggerService.logUserActivity(activityPayload);
  }
  
  /**
   * Track a change in media approval status (approved, rejected, needs_revision)
   * 
   * @param {Object} user - The user who changed the approval status (admin/superAdmin)
   * @param {Object} media - The media item whose status was changed
   * @param {'approved' | 'rejected' | 'needs_revision'} newStatus - The new approval status
   */
  static async trackMediaApprovalStatusChange(user, media, newStatus) {
    if (!user || !media || !newStatus) return;

    const mediaTitle = media.title || 'Untitled';
    let details = `Media file "${mediaTitle}" status changed to ${newStatus.replace('_', ' ')}.`;

    if (newStatus === 'approved') {
      details = `Media file "${mediaTitle}" was approved.`;
    } else if (newStatus === 'rejected') {
      details = `Media file "${mediaTitle}" was rejected.`;
      if (media.approvalFeedback) {
        details += ` Feedback: ${media.approvalFeedback}`;
      }
    } else if (newStatus === 'needs_revision') {
      details = `Media file "${mediaTitle}" was marked as needs revision.`;
      if (media.approvalFeedback) {
        details += ` Feedback: ${media.approvalFeedback}`;
      }
    }

    console.log('ActivityTrackingService: Logging media approval status change with mediaTitle:', mediaTitle, 'New Status:', newStatus);
    const activity = await LoggerService.logActivity({
      userId: user.id,
      username: user.username || user.email,
      action: 'APPROVAL_STATUS_CHANGE', // A more specific action type
      details: details,
      resourceType: 'media',
      resourceId: media.id || media._id,
      mediaSlug: media.slug,
      mediaTitle
    });

    // Process notification
    if (activity) {
      const userRole = await this.getUserRole(user.id);
      activity.userRole = userRole;
      await NotificationService.processActivityNotification(activity, user);
    }
  }
  
  /**
   * Helper to get user role for notification filtering
   * 
   * @param {string} userId - The user ID
   * @returns {Promise<string>} - The user role
   */
  static async getUserRole(userId) {
    try {
      const user = await User.findById(userId);
      return user?.role || 'user';
    } catch (error) {
      console.error('Error getting user role:', error);
      return 'user'; // Default to user role
    }
  }
}

export default ActivityTrackingService; 