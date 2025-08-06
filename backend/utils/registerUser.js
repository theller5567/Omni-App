import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendVerificationEmail } from './sendVerificationEmail.js';

export const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ message: "All fields are required" });
    }
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }
    const username = `${firstName.toLowerCase()}${lastName.toUpperCase()}`;
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "2d" });
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationLink = `${baseUrl}/verify-email?token=${verificationToken}`;

    // Create properly encoded avatar URL with lowercase initials
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toLowerCase();
    const encodedInitials = encodeURIComponent(initials);
    const avatarUrl = `https://api.dicebear.com/9.x/initials/svg?seed=${encodedInitials}&radius=50&backgroundType=gradientLinear&fontSize=26&backgroundRotation=-205`;
    
    user = new User({
      firstName,
      lastName,
      username,
      avatar: avatarUrl,
      email,
      isVerified: false,
      role: 'user',
    });
    await user.save();

    await sendVerificationEmail(user.email, verificationLink);

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Error in registerUser:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}; 