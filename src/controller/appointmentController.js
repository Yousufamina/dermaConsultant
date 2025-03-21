import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import dotenv from 'dotenv';
import twilio from 'twilio';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET; 
// const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
// const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
// const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
// const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Your Twilio account credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken =  process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);

async function sendConfirmation(user, appointment) {
    try {
      // Format the date and time for the message
      const appointmentDate = new Date(appointment.date).toLocaleDateString();
      
      const message = await twilioClient.messages.create({
        body: `Hello ${user.name}, your appointment for ${appointment.service} has been scheduled successfully for ${appointmentDate} at ${appointment.timeSlot}. Thank you for booking with us!`,
        from: 'whatsapp:+14155238886',  // Your Twilio WhatsApp number
        to: `whatsapp:${user.contactNumber}`    // Recipient's number with country code
      });
      
      console.log(`message sent successfully: ${message.sid}`);
      console.log(`Hello ${user.name}, your appointment for ${appointment.service} has been scheduled successfully for ${appointmentDate} at ${appointment.timeSlot}. Thank you for booking with us!`);
      
      return true;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return false;
    }
}
async function sendCancellationMessage(user, appointment) {
    try {
      // Format the date and time for the message
      const appointmentDate = new Date(appointment.date).toLocaleDateString();
      
      const message = await twilioClient.messages.create({
        body: `Hello ${user.name}, your appointment for ${appointment.service} has been cancelled for ${appointmentDate} at ${appointment.timeSlot}. Thank you for booking with us!`,
        from: 'whatsapp:+14155238886',  // Your Twilio WhatsApp number
        to:   `whatsapp:${user.contactNumber}`    // Recipient's number with country code
      });

      console.log(`Hello ${user.name}, your appointment for ${appointment.service} has been cancelled for ${appointmentDate} at ${appointment.timeSlot}. Thank you for booking with us!`)
      console.log(`message sent successfully: ${message.sid}`);
      return true;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
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
        const user = await User.findById(req.user.id);
    
        // Send WhatsApp confirmation
        const messageSent = await sendConfirmation(user, appointment);
    
        res.status(201).json({
            message: 'Appointment booked successfully',
            messageNotification: messageSent ? 'sent' : 'failed',
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

        // Send  Cancellation message 
        const messageSent = await sendCancellationMessage(user, appointment);
        
        res.json({
          message: 'Appointment cancelled successfully',
          appointment
        });
        
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        res.status(500).json({ message: 'Server error' });
    } 
}