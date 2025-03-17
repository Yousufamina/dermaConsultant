import express from 'express';
import mongoose from 'mongoose';
import userRoutes from './routes/authRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import dotenv from 'dotenv';

dotenv.config();

const dbURl = process.env.MONGO_URI 
const app = express();

// Connect to MongoDB
mongoose.connect(dbURl, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB', err));

// Middleware
app.use(express.json());
app.use(express.urlencoded());

// Routes
app.use('/api/auth', userRoutes);
app.use('/api/appointment', appointmentRoutes);
app.use('/', function(req,res){
      console.log("Server is up and running")
      res.send("Server is up and running")
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));