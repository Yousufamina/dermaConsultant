
import mongoose from 'mongoose';

// User Schema
const userSchema = mongoose.Schema({
      contactNumber: { type: String, required: true, unique: true },
      name: { type: String },
      email: { type: String, sparse: true },
      address: { type: String },
      city: { type: String },
      dateOfBirth: { type: Date },
      medicalHistory: { type: String },
      password: { type: String },
      otp: { type: String, default: null },
      otpExpires: { type: Date, default: null },
      isProfileComplete: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
  });
  
export default mongoose.model('User', userSchema);