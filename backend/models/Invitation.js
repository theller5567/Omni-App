import mongoose from "mongoose";

/**
 * Invitation schema for storing user invitations
 * This allows superAdmin users to invite new users to the platform
 */
const invitationSchema = new mongoose.Schema(
  {
    email: { 
      type: String, 
      required: true, 
      trim: true,
      lowercase: true
    },
    firstName: { 
      type: String, 
      required: true, 
      trim: true 
    },
    lastName: { 
      type: String, 
      required: true, 
      trim: true 
    },
    invitedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    role: { 
      type: String, 
      enum: ['admin', 'user', 'distributor'], 
      default: 'user' 
    },
    token: { 
      type: String, 
      required: true,
      unique: true 
    },
    expiresAt: { 
      type: Date, 
      required: true,
      default: function() {
        // Default expiration is 7 days from now
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }
    },
    status: { 
      type: String, 
      enum: ['pending', 'accepted', 'expired', 'cancelled'],
      default: 'pending' 
    },
    acceptedAt: { 
      type: Date 
    },
    message: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

// Add indexes for common queries
invitationSchema.index({ email: 1 });
invitationSchema.index({ token: 1 });
invitationSchema.index({ invitedBy: 1 });
invitationSchema.index({ status: 1 });
invitationSchema.index({ expiresAt: 1 });

// Create a model from the schema
const Invitation = mongoose.model("Invitation", invitationSchema);

export default Invitation; 