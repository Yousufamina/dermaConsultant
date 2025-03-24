import express from "express";
import { book, myAppointments, cancel , getAllAppointments , cancelByAdmin , completedByAdmin , getAllAppointmentsByUserId} from "../controller/appointmentController.js";
import { auth } from "../auth/tokenValidation.js";

const authRoutes = express.Router();

authRoutes.post("/book", auth ,book);
authRoutes.get("/my-appointments", auth, myAppointments);
authRoutes.put("/cancel/:id", auth, cancel);
authRoutes.get("/getAll", getAllAppointments);  // used by admin
authRoutes.get("/cancelByAdmin/:id", cancelByAdmin);  // used by admin
authRoutes.get("/completedByAdmin/:id", completedByAdmin);  // used by admin
authRoutes.get("/user/:id", getAllAppointmentsByUserId);  // used by admin

export default authRoutes;