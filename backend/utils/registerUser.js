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

    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1d" });
    const verificationLink = `http://localhost:5002/api/auth/verify-email/${verificationToken}`;

    user = new User({
      firstName,
      lastName,
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