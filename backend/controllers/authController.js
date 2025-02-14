import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import User from "../models/User.js";

dotenv.config();

// Email Transporter Configuration
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// User Registration (Sign-Up)
export const registerUser = async (req, res) => {
  try {
    const { name, email } = req.body;
    console.log("Sign-Up Request:", { name, email }); // Log incoming sign-up data

    // Check if the user already exists
    let user = await User.findOne({ email });
    if (user) {
      console.log("User already exists:", email); // Log if user already exists
      return res.status(400).json({ message: "User already exists" });
    }

    // Generate a verification token
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1d" });

    // Create new user with unverified email
    user = new User({
      name,
      email,
      username: name, // Set username here
      isVerified: false,
      verificationToken,
    });
    await user.save();

    console.log("New user created:", user.email); // Log newly created user

    // Generate the verification URL
    const verificationUrl = `http://localhost:5002/api/auth/verify-email/${verificationToken}`;
    console.log("Verification URL:", verificationUrl); // Log the verification URL for debugging

    // Send the verification email
    const mailOptions = {
      from: process.env.EMAIL_USER, // Sender's email address (configured in your .env)
      to: email,                    // Recipient's email address
      subject: "Email Verification", // Subject of the email
      html: `<p>Please click the link below to verify your email:</p>
             <a href="${verificationUrl}">Verify Email</a>`, // Email body with the verification link
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("Error sending email:", error); // Log the error
        return res.status(500).json({ message: "Error sending email", error: error.message });
      } else {
        console.log("Verification email sent:", info.response); // Log email sent success
      }
    });

    res.status(201).json({ message: "User created successfully", verificationToken });
  } catch (error) {
    console.error("Error in registerUser:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// User Login (Sign-In) — Ensure this is correctly defined and exported
export const loginUser = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(401).json({ message: "Email not verified. Please check your email." });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.error("Error in loginUser:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Email Verification
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;  // Token passed in the URL params
    const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Decode the token

    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Check if the user is already verified
    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    // If the user is not verified, verify them and clear the verification token
    user.isVerified = true;
    user.verificationToken = null;  // Clear the verification token
    await user.save();

    // After the email is successfully verified, redirect the user to the frontend home page
    res.redirect("http://localhost:5173/home?emailVerified=true");
  } catch (error) {
    console.error("Error in verifyEmail:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};