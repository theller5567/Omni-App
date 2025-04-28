import mongoose from 'mongoose';

/**
 * Schema for activity logs tracking actions performed across the application
 */
const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  action: {
    type: String,
    enum: ['UPLOAD', 'DELETE', 'EDIT', 'CREATE', 'VIEW'],
    required: true
  },
  details: {
    type: String,
    required: true
  },
  resourceType: {
    type: String,
    enum: ['media', 'mediaType', 'user', 'system', 'tag', 'tagCategory'],
    required: true
  },
  resourceId: {
    type: String,
    required: true
  },
  // Add mediaSlug field for easier linking to media in the UI
  mediaSlug: {
    type: String,
    required: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Add indexes for common queries
activityLogSchema.index({ userId: 1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ resourceType: 1 });
activityLogSchema.index({ timestamp: -1 });
activityLogSchema.index({ mediaSlug: 1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog; 