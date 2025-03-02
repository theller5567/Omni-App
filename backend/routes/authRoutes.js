import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";  // ✅ Import the functions
import User from "../models/User.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';


import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the absolute path to the .env file
const envPath = path.resolve(__dirname, '../../.env');

// Load environment variables from the absolute path to the .env file
dotenv.config({ path: envPath });
const router = express.Router();

// Middleware to parse JSON bodies
router.use(express.json());

// Route for user sign-up
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  // Authentication logic here
  // If successful, generate a token
  const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// Route for email verification
router.get("/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decoded.email });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.isVerified = true;
    await user.save();

    // Redirect to the password setup page with the token
    res.redirect(`http://localhost:5173/password-setup?token=${token}`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route for setting up a new password
router.post('/setup-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ email: decoded.email, isVerified: true });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.password = await bcrypt.hash(password, 10); // Hash the password
    await user.save();

    res.status(200).json({ message: 'Password set successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;