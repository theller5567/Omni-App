import express from "express";
import { registerUser, loginUser, verifyEmail } from "../controllers/authController.js";  // ✅ Import the functions
import User from "../models/User.js";

const router = express.Router();

// Middleware to parse JSON bodies
router.use(express.json());

// Route for user sign-up
router.post("/signup", registerUser);

// Route for user login
router.post("/login", loginUser);

// Route for email verification
router.get("/verify-email/:token", verifyEmail);  // This handles the token passed in the URL

// Route for setting up a new password
router.post('/setup-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({ verificationToken: token, isVerified: true });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.password = password;
    user.verificationToken = undefined; // Clear the token after use
    await user.save();

    res.status(200).json({ message: 'Password set successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;