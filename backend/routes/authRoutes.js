import express from "express";
import { registerUser, loginUser, verifyEmail } from "../controllers/authController.js"; // ✅ Add .js

const router = express.Router();

// Define your routes here

// Route for user registration (Sign-Up)
router.post("/signup", registerUser);

// Route for user login (Sign-In)
router.post("/login", loginUser);

// Route for email verification
router.get("/verify/:token", verifyEmail);

export default router;
