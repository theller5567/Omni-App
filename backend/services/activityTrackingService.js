import LoggerService from './loggerService.js';

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
    
    await LoggerService.logActivity({
      userId: user.id,
      username: user.username || user.email,
      action: 'UPLOAD',
      details: `Uploaded media file: ${media.title || media.metadata?.fileName || 'Untitled'}`,
      resourceType: 'media',
      resourceId: media.id || media._id,
      mediaSlug: media.slug
    });
  }
  
  /**
   * Track a media deletion
   * 
   * @param {Object} user - The user who deleted the media
   * @param {Object} media - The deleted media object
   */
  static async trackMediaDeletion(user, media) {
    if (!user || !media) return;
    
    await LoggerService.logActivity({
      userId: user.id,
      username: user.username || user.email,
      action: 'DELETE',
      details: `Deleted media file: ${media.title || media.metadata?.fileName || 'Untitled'}`,
      resourceType: 'media',
      resourceId: media.id || media._id,
      mediaSlug: media.slug
    });
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
    
    await LoggerService.logActivity({
      userId: user.id,
      username: user.username || user.email,
      action: 'EDIT',
      details: `Updated media file: ${media.title || media.metadata?.fileName || 'Untitled'} (${changedFields.join(', ')})`,
      resourceType: 'media',
      resourceId: media.id || media._id,
      mediaSlug: media.slug
    });
  }
  
  /**
   * Track a media type creation
   * 
   * @param {Object} user - The user who created the media type
   * @param {Object} mediaType - The created media type
   */
  static async trackMediaTypeCreation(user, mediaType) {
    if (!user || !mediaType) return;
    
    await LoggerService.logActivity({
      userId: user.id,
      username: user.username || user.email,
      action: 'CREATE',
      details: `Created media type: ${mediaType.name}`,
      resourceType: 'mediaType',
      resourceId: mediaType._id || mediaType.id
    });
  }
  
  /**
   * Track a media type update
   * 
   * @param {Object} user - The user who updated the media type
   * @param {Object} mediaType - The updated media type
   */
  static async trackMediaTypeUpdate(user, mediaType) {
    if (!user || !mediaType) return;
    
    await LoggerService.logActivity({
      userId: user.id,
      username: user.username || user.email,
      action: 'EDIT',
      details: `Updated media type: ${mediaType.name}`,
      resourceType: 'mediaType',
      resourceId: mediaType._id || mediaType.id
    });
  }
  
  /**
   * Track a media type deletion
   * 
   * @param {Object} user - The user who deleted the media type
   * @param {Object} mediaType - The deleted media type
   */
  static async trackMediaTypeDeletion(user, mediaType) {
    if (!user || !mediaType) return;
    
    await LoggerService.logActivity({
      userId: user.id,
      username: user.username || user.email,
      action: 'DELETE',
      details: `Deleted media type: ${mediaType.name}`,
      resourceType: 'mediaType',
      resourceId: mediaType._id || mediaType.id
    });
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
    
    await LoggerService.logActivity({
      userId: actor.id,
      username: actor.username || actor.email,
      action: 'EDIT',
      details: `Updated user profile for ${targetUser.username || targetUser.email} (${changedFields.join(', ')})`,
      resourceType: 'user',
      resourceId: targetUser._id || targetUser.id
    });
    
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
    
    await LoggerService.logActivity({
      userId: actor.id,
      username: actor.username || actor.email,
      action: 'CREATE',
      details: `Created new user account: ${newUser.username || newUser.email}`,
      resourceType: 'user',
      resourceId: newUser._id || newUser.id
    });
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
    await LoggerService.logActivity({
      userId: user.id,
      username: user.username || user.email,
      action: 'EDIT',
      details: `Changed password`,
      resourceType: 'user',
      resourceId: user.id
    });
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
    
    // Look up the user ID if possible, but don't require it
    let userId = null;
    let username = email;
    
    // Log the failed login attempt
    await LoggerService.logUserActivity({
      userId: userId || 'unknown',
      username,
      email,
      action: 'FAILED_LOGIN',
      ip,
      userAgent,
      details: {
        success: false
      }
    });
  }
}

export default ActivityTrackingService; 