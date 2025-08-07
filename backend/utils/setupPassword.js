import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/User.js';

export const setupPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: "Token and password are required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Set the plain text password; the pre-save hook will hash it
    user.password = password;

    // Debugging: Log the hashed password
    console.log('Hashed password:', user.password);

    await user.save();
    console.log('Password updated successfully for user:', user.email);
    res.status(200).json({ message: "Password set successfully" });
  } catch (error) {
    console.error("Error in setupPassword:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}; 