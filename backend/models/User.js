import mongoose from "mongoose";

// User schema
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },  // email must be unique
    username: { type: String, unique: true, sparse: true },  // Make username optional and unique
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
  },
  { timestamps: true }
);

// Create a model from the schema
const User = mongoose.model("User", userSchema);

export default User;