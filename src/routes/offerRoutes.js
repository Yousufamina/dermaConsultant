import express from "express";
import multer from 'multer';
import path  from 'path';
import fs from 'fs';
import { addOffer, getAllOffers, getOfferDetail ,updateOffer, deleteOfferByAdmin } from "../controller/offerController.js";

const offerRoutes = express.Router();

// Set up multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = 'uploads/offer';
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'offer-' + uniqueSuffix + ext);
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
    fileSize: 50 * 1024 * 1024 // 5MB limit
}
});
  
offerRoutes.post("/create", upload.single('image'), addOffer);
offerRoutes.get("/getAll", getAllOffers);
offerRoutes.get("/getOne/:id", getOfferDetail); 
offerRoutes.put("/update/:id",upload.single('image'), updateOffer); 
offerRoutes.get("/delete/:id", deleteOfferByAdmin);   // used by admin

export default offerRoutes;