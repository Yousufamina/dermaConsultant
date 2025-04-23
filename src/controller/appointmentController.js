import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import path  from 'path';
const serviceAccount = path.join(process.cwd(), 'config' , 'derma-consult-firebase-adminsdk-n2c9l-8fac5444c0.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


// import twilio from 'twilio';

dotenv.config();

// const TWILIO_ACCOUNT_SID = process.env.account_sid;
// const TWILIO_AUTH_TOKEN = process.env.auth_token;
// const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
// const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// async function sendApprovalMessage(user, appointment) {
//     try {
//       // Format the date and time for the message
//       const appointmentDate = new Date(appointment.date).toLocaleDateString();
      
//       const message = await twilioClient.messages.create({
//         body: `Hello ${user.name}, your appointment for ${appointment.service} has been scheduled successfully for ${appointmentDate} at ${appointment.timeSlot}. Thank you for booking with us!`,
//         from: 'whatsapp:+14155238886',  // Your Twilio WhatsApp number
//         to: `whatsapp:${user.contactNumber}`    // Recipient's number with country code
//       });
      
//       console.log(`message sent successfully: ${message.sid}`);
//       console.log(`Hello ${user.name}, your appointment for ${appointment.service} has been scheduled successfully for ${appointmentDate} at ${appointment.timeSlot}. Thank you for booking with us!`);
      
//       return true;
//     } catch (error) {
//       console.error('Error sending WhatsApp message:', error);
//       return false;
//     }
// }

// async function sendCancellationMessage(user, appointment) {
//     try {
//       // Format the date and time for the message
//       const appointmentDate = new Date(appointment.date).toLocaleDateString();
      
//       const message = await twilioClient.messages.create({ 
//         body: `Hello ${user.name}, your appointment for ${appointment.service} has been cancelled for ${appointmentDate} at ${appointment.timeSlot}. Thank you for booking with us!`,
//         from: 'whatsapp:+14155238886',  // Your Twilio WhatsApp number
//         to:   `whatsapp:${user.contactNumber}`    // Recipient's number with country code
//       });

//       console.log(`Hello ${user.name}, your appointment for ${appointment.service} has been cancelled for ${appointmentDate} at ${appointment.timeSlot}. Thank you for booking with us!`)
//       console.log(`message sent successfully: ${message.sid}`);
//       return true;
//     } catch (error) {
//       console.error('Error sending WhatsApp message:', error);
//       return false;
//     }
// }

async function sendApprovalMessage(deviceId, name, appointment) {
  try {
    // Format the date and time for the message
    const appointmentDate = new Date(appointment.date).toLocaleDateString();
    const message = {
      notification: {
        title: 'Appointment Approved',
        body: `Hello ${name}, your appointment for ${appointment.service} has been scheduled successfully for ${appointmentDate} at ${appointment.timeSlot}. Thank you for booking with us!`,
      },
      token: deviceId
    };
    const response = await admin.messaging().send(message);
    console.log(`message sent successfully: ${response}`);
    console.log(`Hello ${name}, your appointment for ${appointment.service} has been scheduled successfully for ${appointmentDate} at ${appointment.timeSlot}. Thank you for booking with us!`);
   
    return true;
  } catch (error) {
      console.error('Error sending notification:');
    return false;
  }
}  
   
async function sendCancellationMessage(deviceId, name, appointment) {
  try {
    // Format the date and time for the message
    const appointmentDate = new Date(appointment.date).toLocaleDateString();
    const message = {
      notification: {
        title: 'Appointment Cancelled',
        body: `Hello ${name}, your appointment for ${appointment.service} has been cancelled for ${appointmentDate} at ${appointment.timeSlot}.`,
      },
      token: deviceId
    };

    const response = await admin.messaging().send(message);
    
    console.log(`Hello ${name}, your appointment for ${appointment.service} has been cancelled for ${appointmentDate} at ${appointment.timeSlot}.`)
    console.log(`message sent successfully: ${response}`);
    
    return true;
  } catch (error) {
    console.error('Error sending notification message:');
    return false;
  }
}

export const book = async(req, res) =>{

    try {
        const { date, timeSlot, service } = req.body;
        
        // Basic validation
        if (!date || !timeSlot || !service) {
          return res.status(400).json({ message: 'Please provide date, time slot and service' });
        }
        
        // Check if the time slot is available
        const existingAppointment = await Appointment.findOne({
          date: new Date(date),
          timeSlot,
          status: 'scheduled'
        });
        
        if (existingAppointment) {
          return res.status(400).json({ message: 'This time slot is already booked' });
        }
        
        // Create new appointment
        const appointment = new Appointment({
          userId: req.user.id, // From auth middleware
          date: new Date(date),
          timeSlot,
          service
        });
        
        await appointment.save();
        
       // Get user details for WhatsApp message
        // const user = await User.findById(req.user.id);
    
        // Send notification fo scheduling
        // const messageSent = await sendConfirmation(user, appointment);
    
        res.status(201).json({
            message: 'Appointment booked successfully',
            appointment
        });
        
      } catch (error) {
        console.error('Error booking appointment:', error);
        res.status(500).json({ message: 'Server error' });
      }
}

export const myAppointments = async(req, res) =>{
    try {
        const appointments = await Appointment.find({ userId: req.user.id })
          .sort({ date: 1 })
          .exec();
          
        res.json(appointments);
        
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ message: 'Server error' });
    }  
}

export const cancel = async(req, res) =>{
    try {
        const appointment = await Appointment.findOne({ 
          _id: req.params.id,
          userId: req.user.id
        });
        
        if (!appointment) {
          return res.status(404).json({ message: 'Appointment not found' });
        }
        
        appointment.status = 'cancelled';
        await appointment.save();

        // Get user details for message
        const user = await User.findById(req.user.id);
        const deviceTokens = user.devices;
        
        // Send Cancellation notification message 
        const result = await Promise.all(
          deviceTokens.map(token => sendCancellationMessage(token.deviceId, user.name , appointment))
        );

        if(result){
          res.json({
            message: 'Appointment cancellation message sent successfully ',
            appointment
          });
        }else{
          res.json({
            message: 'Appointment cancellation message sent failed ',
            appointment
          });
        }
        
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        res.status(500).json({ message: 'Server error' });
    } 
}

export const getAllAppointments = async(req,res) => {
  try {
    const appointments = await Appointment.find().populate('userId', 'name email contactNumber')
      .sort({ createdAt: -1 })
      .exec();
console.log(appointments)
      res.json(appointments);
    
  } catch (error) {
      console.error('Error fetching appointments:', error);
      res.status(500).json({ message: 'Server error' });
  } 
}

export const deleteByAdmin = async(req,res) =>{
  try {
    const appointment = await Appointment.findOne({ 
      _id: req.params.id,
    });
    
    if (!appointment) {
      console.log("Appointment not found")
      return res.status(404).json({ message: 'Appointment not found' });
    }
    console.log("Appointment deleted successfully")
    
    await Appointment.findByIdAndDelete(req.params.id);
    res.status(200).json({
      message: 'appointment deleted successfully'
    })
    
  } catch (error) {
      console.error('Error deleting appointment:', error);
      res.status(500).json({ message: 'Server error' });
  } 
}

export const cancelByAdmin = async(req, res) =>{
  try {
      const appointment = await Appointment.findOne({ 
        _id: req.params.id,
      });
      
      if (!appointment) {
        console.log("Appointment status change to cancel not found")
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      appointment.status = 'cancelled';
      await appointment.save();
      console.log("Appointment status change to cancelled")

      // Get user details for message
      const user = await User.findById(appointment.userId);
      console.log(user)
      const deviceTokens = user.devices;
        
      // Send Cancellation notification message 
      const result = await Promise.all(
        deviceTokens.map(token => sendCancellationMessage(token.deviceId, user.name , appointment))
      );

      if(result){
        res.json({
          message: 'Appointment cancellation message sent successfully ',
          appointment
        });
      }else{
        res.json({
          message: 'Appointment cancellation message sent failed ',
          appointment
        });
      } 
      
  } catch (error) {
      console.error('Error cancelling appointment:', error);
      res.status(500).json({ message: 'Server error' });
  } 
}

export const approvedByAdmin = async(req, res) =>{
  try {
      const appointment = await Appointment.findOne({ 
        _id: req.params.id,
      });
      
      if (!appointment) {
        console.log("Appointment status change to approved not found")
        return res.status(404).json({ message: 'Appointment not found' });
      }
      appointment.status = 'approved';
      await appointment.save();
      console.log("Appointment status change to approved")

       // Get user details for message
       const user = await User.findById(appointment.userId);
      const deviceTokens = user.devices;
        
      // Send Cancellation notification message 
      const result = await Promise.all(
        deviceTokens.map(token => sendApprovalMessage(token.deviceId, user.name , appointment))
      );

      if(result){
        res.json({
          message: 'Appointment Approved message sent successfully ',
          appointment
        });
      }else{
        res.json({
          message: 'Appointment Approved message sent failed ',
          appointment
        });
      }     
  } catch (error) {
      console.error('Error completing appointment:', error);
      res.status(500).json({ message: 'Server error' });
  } 
}

export const getAllAppointmentsByUserId = async(req,res) =>{
  try {
    console.log("api called")
    const appointments = await Appointment.find({ userId: req.params.id })
      .sort({ date: 1 })
      .exec();
      console.log(appointments)

    res.status(200).json(appointments)
    
  } catch (error) {
      console.error('Error fetching appointments:', error);
      res.status(500).json({ message: 'Server error' });
  }  
}