import express from "express";
import { registerUser, loginUser, verifyEmail } from "../controllers/authController.js";  // ✅ Import the functions
const router = express.Router();

// Route for user sign-up
router.post("/signup", registerUser);

// Route for user login
router.post("/login", loginUser);

// Route for email verification
router.get("/verify-email/:token", verifyEmail);  // This handles the token passed in the URL

export default router;