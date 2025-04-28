import mongoose from 'mongoose';

/**
 * Schema for user activities like logins, logouts, and password changes
 */
const userActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  action: {
    type: String,
    enum: ['LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'PROFILE_UPDATE', 'FAILED_LOGIN'],
    required: true
  },
  ip: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  // Additional metadata can be stored here
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

// Add indexes for common queries
userActivitySchema.index({ userId: 1 });
userActivitySchema.index({ action: 1 });
userActivitySchema.index({ timestamp: -1 });
userActivitySchema.index({ ip: 1 });

const UserActivity = mongoose.model('UserActivity', userActivitySchema);

export default UserActivity; 