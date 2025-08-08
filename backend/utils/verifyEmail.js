import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);

    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // If already verified, still allow redirect to password setup so users who never completed
    // password creation can finish the flow.
    const rawBase = process.env.FRONTEND_URL || 'http://localhost:5173';
    const baseUrl = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;
    const redirectUrl = `${baseUrl}/password-setup?token=${token}`;

    if (user.isVerified) {
      return res.status(200).json({ message: "Email is already verified. Please set up your password.", redirectUrl });
    }

    user.isVerified = true;
    await user.save();

    res.status(200).json({ message: "Email verified successfully. Please set up your password.", redirectUrl });
  } catch (error) {
    console.error("Error in verifyEmail:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}; 