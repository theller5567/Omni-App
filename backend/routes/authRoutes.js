import express from "express";
import { loginUser, verifyEmail, setupPassword, registerUser } from "../controllers/authController.js";  // ✅ Import the functions
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

// Sign-in route
router.post('/login', loginUser);

// Email verification route
router.get('/verify-email/:token', verifyEmail);

// Route for setting up a new password
router.post('/password-setup', setupPassword);

// Account creation route
router.post('/register', registerUser);


export default router;