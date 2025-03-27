
import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    timeSlot: {
      type: String,
      required: true
    },
    service: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['scheduled', 'approved', 'cancelled'],
      default: 'scheduled'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });
  
  export default mongoose.model('Appointment', appointmentSchema);