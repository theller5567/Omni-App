import path from 'path';
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
export { sendVerificationEmail } from '../utils/sendVerificationEmail.js';
export { loginUser } from '../utils/loginUser.js';
export { logoutUser } from '../utils/logoutUser.js';
export { registerUser } from '../utils/registerUser.js';
export { verifyEmail } from '../utils/verifyEmail.js';
export { setupPassword } from '../utils/setupPassword.js';

// Convert import.meta.url to a file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });
