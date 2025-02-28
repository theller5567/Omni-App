import mongoose from "mongoose";
import bcrypt from "bcrypt";

// User schema
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },  // email must be unique
    username: { type: String, unique: true, sparse: true },  // Make username optional and unique
    password: { type: String }, // Add password field
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Create a model from the schema
const User = mongoose.model("User", userSchema);

export default User;