import express from 'express';
import mongoose from 'mongoose';
import userRoutes from './routes/authRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import askDoctorRoutes from './routes/askDoctorRoutes.js';
import offerRoutes from './routes/offerRoutes.js';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';
import https from'https';

dotenv.config();

// const dbURl = process.env.MONGO_URI;
const dbURl = "mongodb+srv://admin:O7U1ZG7GLYzHIB3R@derma-consltant-testing.o7z5h.mongodb.net/";
const app = express();

const options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert')
};

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
app.use(cors());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', userRoutes);
app.use('/api/appointment', appointmentRoutes);
app.use('/api/doctor', askDoctorRoutes);
app.use('/api/offer', offerRoutes);
app.use('/test', function(req,res){
      console.log("Server is up and running")
      res.send("Server is up and running")
});
app.get('/', (request, response) => {
  response.sendStatus(200);
});
// Start server
const PORT = process.env.PORT || 3000;

// https.createServer(options, app).listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
