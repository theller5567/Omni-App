import Invitation from '../models/Invitation.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sendInvitationEmail } from '../utils/sendInvitationEmail.js';
import mongoose from 'mongoose';

/**
 * Creates a new invitation
 * @route POST /api/invitations
 * @access Private - superAdmin, admin
 */
export const createInvitation = async (req, res) => {
  try {
    // Log the entire request body for debugging
    console.log('Create invitation request body:', req.body);
    console.log('Authenticated user:', req.user);
    
    const { email, firstName, lastName, role, message, invitedBy } = req.body;
    
    // Check if required fields are provided
    if (!email || !firstName || !lastName) {
      return res.status(400).json({ message: 'Email, first name, and last name are required' });
    }
    
    // Check if the email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Check if there's already a pending invitation for this email
    const existingInvitation = await Invitation.findOne({ 
      email, 
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });
    
    if (existingInvitation) {
      return res.status(400).json({ 
        message: 'An invitation has already been sent to this email and is still pending',
        invitationId: existingInvitation._id
      });
    }
    
    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Get the invitedBy value - prefer req.user.id if not explicitly provided
    const invitedByValue = invitedBy || req.user.id;
    
    console.log('Creating invitation with invitedBy:', invitedByValue);
    
    // Convert string IDs to ObjectId if needed
    let invitedByObjectId;
    try {
      // Check if it's already a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(invitedByValue)) {
        invitedByObjectId = invitedByValue;
      } else {
        // If it's not a valid ObjectId, it might be causing the error
        console.log('Invalid ObjectId format for invitedBy:', invitedByValue);
        // Fallback to the user ID from the token
        invitedByObjectId = req.user.id;
      }
    } catch (err) {
      console.error('Error converting invitedBy to ObjectId:', err);
      // Fallback to the user ID from the token
      invitedByObjectId = req.user.id;
    }
    
    console.log('Final invitedBy value for invitation:', invitedByObjectId);
    
    // Create the invitation
    const invitation = new Invitation({
      email,
      firstName,
      lastName,
      invitedBy: invitedByObjectId,
      role: role || 'user',
      token,
      message,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });
    
    await invitation.save();
    
    // Build invitation link with correct frontend URL
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const invitationLink = `${baseUrl}/accept-invitation/${token}`;
    
    // Get inviter's name
    const inviter = await User.findById(invitedByObjectId);
    const inviterName = inviter 
      ? `${inviter.firstName} ${inviter.lastName}` 
      : 'An administrator';
    
    // Send invitation email
    await sendInvitationEmail(
      email,
      firstName,
      lastName,
      inviterName,
      invitationLink,
      role || 'user',
      message
    );
    
    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        status: invitation.status
      }
    });
    
  } catch (error) {
    console.error('Error creating invitation:', error);
    res.status(500).json({ message: 'Server error creating invitation' });
  }
};

/**
 * Gets all invitations
 * @route GET /api/invitations
 * @access Private - superAdmin, admin
 */
export const getInvitations = async (req, res) => {
  try {
    // Optional filters from query params
    const { status, role } = req.query;
    
    // Build filter object
    const filter = {};
    
    // Add filters if provided
    if (status) filter.status = status;
    if (role) filter.role = role;
    
    // Add invitedBy filter if not superAdmin
    if (req.user.role !== 'superAdmin') {
      filter.invitedBy = req.user._id;
    }
    
    // Find invitations
    const invitations = await Invitation.find(filter)
      .sort({ createdAt: -1 }) // Most recent first
      .populate('invitedBy', 'firstName lastName email');
    
    res.status(200).json(invitations);
    
  } catch (error) {
    console.error('Error getting invitations:', error);
    res.status(500).json({ message: 'Server error getting invitations' });
  }
};

/**
 * Gets a single invitation by ID
 * @route GET /api/invitations/:id
 * @access Private - superAdmin, admin
 */
export const getInvitationById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const invitation = await Invitation.findById(id)
      .populate('invitedBy', 'firstName lastName email');
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }
    
    // Check access if not superAdmin
    if (req.user.role !== 'superAdmin' && 
        invitation.invitedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this invitation' });
    }
    
    res.status(200).json(invitation);
    
  } catch (error) {
    console.error('Error getting invitation:', error);
    res.status(500).json({ message: 'Server error getting invitation' });
  }
};

/**
 * Validates an invitation token
 * @route GET /api/invitations/validate/:token
 * @access Public
 */
export const validateInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    
    const invitation = await Invitation.findOne({ 
      token,
      status: 'pending',
      expiresAt: { $gt: new Date() } // Not expired
    });
    
    if (!invitation) {
      return res.status(404).json({ 
        valid: false,
        message: 'Invitation is invalid, expired, or has already been used' 
      });
    }
    
    res.status(200).json({
      valid: true,
      invitation: {
        email: invitation.email,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        role: invitation.role,
        expiresAt: invitation.expiresAt
      }
    });
    
  } catch (error) {
    console.error('Error validating invitation:', error);
    res.status(500).json({ valid: false, message: 'Server error validating invitation' });
  }
};

/**
 * Accepts an invitation and creates a new user
 * @route POST /api/invitations/accept/:token
 * @access Public
 */
export const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }
    
    // Find the invitation
    const invitation = await Invitation.findOne({ 
      token,
      status: 'pending',
      expiresAt: { $gt: new Date() } // Not expired
    });
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation is invalid, expired, or has already been used' });
    }
    
    // Check if a user with this email already exists
    const existingUser = await User.findOne({ email: invitation.email });
    if (existingUser) {
      invitation.status = 'cancelled';
      await invitation.save();
      return res.status(400).json({ message: 'A user with this email already exists' });
    }
    
    // Create the new user
    const user = new User({
      firstName: invitation.firstName,
      lastName: invitation.lastName,
      email: invitation.email,
      username: `${invitation.firstName.toLowerCase()}${invitation.lastName.toLowerCase()}`,
      password,
      isVerified: true, // Auto-verified since they came through invitation
      role: invitation.role
    });
    
    await user.save();
    
    // Update invitation status
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    await invitation.save();
    
    // Generate authentication token
    const authToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(200).json({
      message: 'Invitation accepted and account created successfully',
      token: authToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ message: 'Server error accepting invitation' });
  }
};

/**
 * Cancels an invitation
 * @route DELETE /api/invitations/:id
 * @access Private - superAdmin, admin
 */
export const cancelInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const invitation = await Invitation.findById(id);
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }
    
    // Check access if not superAdmin
    if (req.user.role !== 'superAdmin' && 
        invitation.invitedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this invitation' });
    }
    
    // Check if it can be cancelled
    if (invitation.status !== 'pending') {
      return res.status(400).json({
        message: `Invitation cannot be cancelled because it's already ${invitation.status}`
      });
    }
    
    // Update status
    invitation.status = 'cancelled';
    await invitation.save();
    
    res.status(200).json({ message: 'Invitation cancelled successfully' });
    
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    res.status(500).json({ message: 'Server error cancelling invitation' });
  }
};

/**
 * Resends an invitation
 * @route POST /api/invitations/:id/resend
 * @access Private - superAdmin, admin
 */
export const resendInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    
    const invitation = await Invitation.findById(id);
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }
    
    // Check access if not superAdmin
    if (req.user.role !== 'superAdmin' && 
        invitation.invitedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to resend this invitation' });
    }
    
    // Check if it can be resent
    if (invitation.status !== 'pending') {
      return res.status(400).json({
        message: `Invitation cannot be resent because it's already ${invitation.status}`
      });
    }
    
    // Reset expiration date
    invitation.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    await invitation.save();
    
    // Build invitation link with correct frontend URL
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const invitationLink = `${baseUrl}/accept-invitation/${invitation.token}`;
    
    // Get inviter's name
    const inviter = await User.findById(invitation.invitedBy);
    const inviterName = inviter 
      ? `${inviter.firstName} ${inviter.lastName}` 
      : 'An administrator';
    
    // Send invitation email
    await sendInvitationEmail(
      invitation.email,
      invitation.firstName,
      invitation.lastName,
      inviterName,
      invitationLink,
      invitation.role,
      invitation.message
    );
    
    res.status(200).json({ 
      message: 'Invitation resent successfully',
      expiresAt: invitation.expiresAt
    });
    
  } catch (error) {
    console.error('Error resending invitation:', error);
    res.status(500).json({ message: 'Server error resending invitation' });
  }
}; 