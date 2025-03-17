import User from '../models/User.js';
import joi from 'joi';
import dotenv from 'dotenv';
import twilio from 'twilio';
import jwt from 'jsonwebtoken';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET_KEY; 
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;


const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Validation schema for signup
const signupValidation = joi.object({
  name: joi.string().required(),
  email: joi.string().email().required(),
  contactNumber: joi.string().pattern(/^(\+92|0092|0)3[0-9]{9}$/).required(),
  address: joi.string().required(),
  city: joi.string().required(),
  dateOfBirth: joi.date().required(),
  medicalHistory: joi.string().allow(''),
});

// Validation schema for login/signup request
const loginRequestValidation = joi.object({
  contactNumber: joi.string().pattern(/^(\+92|0092|0)[0-9]{10}$/).required()
});

// Validation schema for OTP verification
const otpVerifyValidation = joi.object({
  contactNumber: joi.string().pattern(/^(\+92|0092|0)[0-9]{10}$/).required(),
  otp: joi.string().length(6).pattern(/^[0-9]+$/).required()
});

// Validation schema for completing profile
const completeProfileValidation = joi.object({
  name: joi.string().required(),
  email: joi.string().email().required(),
  contactNumber: joi.string().pattern(/^(\+92|0092|0)[0-9]{10}$/).required(),
  address: joi.string().required(),
  city: joi.string().required(),
  dateOfBirth: joi.date().required(),
  medicalHistory: joi.string().allow('')
});


// Function to generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Function to format phone number for Twilio
function formatPhoneNumber(phoneNumber) {
  // Make sure the number starts with +
  if (phoneNumber.startsWith('00')) {
    return '+' + phoneNumber.substring(2);
  } else if (phoneNumber.startsWith('0')) {
    return '+92' + phoneNumber.substring(1);
  } else if (!phoneNumber.startsWith('+')) {
    return '+' + phoneNumber;
  }
  return phoneNumber;
}

// Function to send OTP via SMS (placeholder)
async function sendOTP(contactNumber, otp) {
  try {
    const formattedNumber = formatPhoneNumber(contactNumber);
    console.log(TWILIO_AUTH_TOKEN)
    
    const message = await twilioClient.messages.create({
      body: `Your verification code is: ${otp}. This code will expire in 10 minutes.`,
      from: TWILIO_PHONE_NUMBER,
      to: formattedNumber
    });
    
    console.log(`OTP sent successfully. Message SID: ${message.sid}`);
    return true;
  } catch (error) {
    console.error('Error sending OTP:', error);
    return false;
  }
}

export const request = async(req, res) =>{
  try {
    
    // Validate request body
    console.log(req.body)

    const { error } = loginRequestValidation.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const contactNumber = req.body.contactNumber;
    let normalizedNumber = contactNumber;
    let alternativeFormat = '';

    // If number starts with +92, create an alternative with 0
    if (contactNumber.startsWith('+92')) {
      alternativeFormat = '0' + contactNumber.substring(3); // +92301... -> 0301...
    } 
    // If number starts with 0, create an alternative with +92
    else if (contactNumber.startsWith('0')) {
      alternativeFormat = '+92' + contactNumber.substring(1); // 0301... -> +92301...
    }

    // Check if user exists with given contact number
    let user = await User.findOne({
      $or: [
        { contactNumber: normalizedNumber },
        { contactNumber: alternativeFormat }
      ]
    });

    // If user doesn't exist, create a minimal placeholder user
    if (!user) {
      user = new User({
        contactNumber: req.body.contactNumber, 
        isProfileComplete: false
      });
      await user.save();
    }

    // Generate OTP
    const otp = generateOTP();
    // Set OTP expiration (10 minutes)
    const otpExpires = new Date();
    otpExpires.setMinutes(otpExpires.getMinutes() + 10);
    
    // Save OTP to user document
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();
    
    // Send OTP via SMS
    const otpSent = await sendOTP(user.contactNumber, otp);
    
    if (!otpSent) {
      return res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
    
    res.status(200).json({
      success: true,
      otp:otp , 
      message: 'OTP sent successfully',
      expiresIn: '10 minutes'
    });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
}

export const verify = async (req, res) => {
  try {
    // Validate request body
    const { error } = otpVerifyValidation.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const contactNumber = req.body.contactNumber;
    let alternativeFormat = '';

    // If number starts with +92, create an alternative with 0
    if (contactNumber.startsWith('+92')) {
      alternativeFormat = '0' + contactNumber.substring(3); // +92301... -> 0301...
    } 
    // If number starts with 0, create an alternative with +92
    else if (contactNumber.startsWith('0')) {
      alternativeFormat = '+92' + contactNumber.substring(1); // 0301... -> +92301...
    }

    // Check if user exists with given contact number
    const user = await User.findOne({
      $or: [
        { contactNumber: contactNumber },
        { contactNumber: alternativeFormat }
      ]
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found with this contact number' });
    }

    // Check if OTP exists and hasn't expired
    if (!user.otp || !user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP expired or invalid' });
    }

    // Verify OTP
    if (user.otp !== req.body.otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Clear OTP
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    // Check if user profile is complete
    if (!user.isProfileComplete) {
      return res.status(200).json({
        success: true,
        message: 'OTP verified successfully. Profile completion required.',
        isProfileComplete: false,
        contactNumber: user.contactNumber
      });
    }

    // Create user data to return
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      contactNumber: user.contactNumber,
      address: user.address,
      city: user.city,
      dateOfBirth: user.dateOfBirth,
      medicalHistory: user.medicalHistory
    };

    // Create and sign the JWT token
    const payload = {
      userId: user._id
    };
    
    const token = jwt.sign(
      payload, 
      JWT_SECRET
    );
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      isProfileComplete: true,
      user: userData,
      token: token
    });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
}

export const completeProfile = async (req, res) => {
  try {

    // Validate request body
    const { error } = completeProfileValidation.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const contactNumber = req.body.contactNumber;
    let alternativeFormat = '';

    // If number starts with +92, create an alternative with 0
    if (contactNumber.startsWith('+92')) {
      alternativeFormat = '0' + contactNumber.substring(3); // +92301... -> 0301...
    } 
    // If number starts with 0, create an alternative with +92
    else if (contactNumber.startsWith('0')) {
      alternativeFormat = '+92' + contactNumber.substring(1); // 0301... -> +92301...
    }

    // Check if user exists with given contact number
    const user = await User.findOne({
      $or: [
        { contactNumber: contactNumber },
        { contactNumber: alternativeFormat }
      ]
    });
    
    
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found with this contact number' });
    }

    // Check if email is already in use by another user
    if (req.body.email) {
      const emailExists = await User.findOne({ 
        email: req.body.email, 
        contactNumber: { $ne: req.body.contactNumber } 
      });
      
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      } 
    }

    const localDate = new Date(req.body.dateOfBirth);
    // Force the date to be interpreted as UTC
    const utcDate = new Date(Date.UTC(
      localDate.getFullYear(),
      localDate.getMonth(),
      localDate.getDate()
    ));

    // Update user profile
    user.name = req.body.name;
    user.email = req.body.email;
    user.address = req.body.address;
    user.city = req.body.city;
    user.dateOfBirth = new Date(utcDate);
    user.medicalHistory = req.body.medicalHistory || '';
    user.isProfileComplete = true;

    // Save updated user
    await user.save();
    
    // Create user data to return
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      contactNumber: user.contactNumber,
      address: user.address,
      city: user.city,
      dateOfBirth: user.dateOfBirth,
      medicalHistory: user.medicalHistory
    };
      // Create and sign the JWT token
    const payload = {
      userId: user._id
    };

    const token = jwt.sign(
      payload, 
      JWT_SECRET
    );
    
    res.status(200).json({
      success: true,
      message: 'Profile completed successfully',
      user: userData,
      token: token
    });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Server Error', error: err.message });
  }
}