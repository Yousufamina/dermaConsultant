import express from "express";
import { book, myAppointments, cancel , getAllAppointments , deleteByAdmin,cancelByAdmin , approvedByAdmin , getAllAppointmentsByUserId} from "../controller/appointmentController.js";
import { auth } from "../auth/tokenValidation.js";

const authRoutes = express.Router();

authRoutes.post("/book", auth ,book);
authRoutes.get("/my-appointments", auth, myAppointments);
authRoutes.put("/cancel/:id", auth, cancel);
authRoutes.get("/getAll", getAllAppointments);  // used by admin
authRoutes.get("/deleteByAdmin/:id", deleteByAdmin);  // used by admin
authRoutes.get("/cancelByAdmin/:id", cancelByAdmin);  // used by admin
authRoutes.get("/approvedByAdmin/:id", approvedByAdmin);  // used by admin
authRoutes.get("/user/:id", getAllAppointmentsByUserId);  // used by admin

export default authRoutes;