
import mongoose from 'mongoose';

// Define Medical Question Schema
const medicalQuestionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  concern: {
    type: String,
    required: true
  },
  question: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'answered', 'closed'],
    default: 'pending'
  },
  answer: {
    text: {
      type: String,
      required: false
    },
    answeredAt: {
      type: Date,
      required: false
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('MedicalQuestion', medicalQuestionSchema);