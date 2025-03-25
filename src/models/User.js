
import mongoose from 'mongoose';

// User Schema
const userSchema = mongoose.Schema({
      googleId: {type: String, required: true, unique: true},
      name: { type: String },
      email: { type: String, sparse: true },
      address: { type: String },
      city: { type: String },
      dateOfBirth: { type: Date },
      contactNumber: { type: String },
      medicalHistory: { type: String },
      devices: [{
        deviceId: String, 
        active: { type: Boolean, default: true }
      }],
      // otp: { type: String, default: null },
      // otpExpires: { type: Date, default: null },
      isProfileComplete: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
  });
  
export default mongoose.model('User', userSchema);