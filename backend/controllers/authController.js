import path from 'path';
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { fileURLToPath } from 'url';
export { sendVerificationEmail } from '../utils/sendVerificationEmail.js';
export { loginUser } from '../utils/loginUser.js';
export { registerUser } from '../utils/registerUser.js';
export { verifyEmail } from '../utils/verifyEmail.js';
export { setupPassword } from '../utils/setupPassword.js';

// Convert import.meta.url to a file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve the absolute path to the .env file
const envPath = path.resolve(__dirname, '../../.env');
console.log('Resolved .env path:', envPath);

// Load environment variables from the absolute path to the .env file
dotenv.config({ path: envPath });

// Log environment variables to verify they are loaded
console.log('Email User:', process.env.EMAIL_USER);

// Email Transporter Configuration
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

