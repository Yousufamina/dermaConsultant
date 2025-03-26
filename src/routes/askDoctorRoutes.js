import express from "express";
import multer from 'multer';
import path  from 'path';
import fs from 'fs';
import { auth } from "../auth/tokenValidation.js";
import { question, myQuestions, questionDetail , answer , getAllQuestions , getQuestionDetail , deleteQuestionByAdmin} from "../controller/askDoctorController.js";

const askDoctorRoutes = express.Router();

// Set up multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = 'uploads/medical';
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'medical-' + uniqueSuffix + ext);
    }
});
  
// File filter to accept only images
const fileFilter = (req, file, cb) => {
if (file.mimetype.startsWith('image/')) {
    cb(null, true);
} else {
    cb(new Error('Only image files are allowed!'), false);
}
};

const upload = multer({ 
storage: storage,
fileFilter: fileFilter,
limits: {
    fileSize: 20 * 1024 * 1024 // 5MB limit
}
});
  
askDoctorRoutes.post("/question", auth ,upload.single('image') ,question);
askDoctorRoutes.get("/my-questions", auth, myQuestions);
askDoctorRoutes.get("/question/:id", auth, questionDetail);
askDoctorRoutes.post("/answer", answer);
askDoctorRoutes.get("/allQuestions", getAllQuestions);  // used by admin
askDoctorRoutes.get("/getQuestion/:id", getQuestionDetail);   // used by admin
askDoctorRoutes.get("/deleteQuestion/:id", deleteQuestionByAdmin);   // used by admin

export default askDoctorRoutes;