import express from "express";
import { book, myAppointments, cancel} from "../controller/appointmentController.js";
import { auth } from "../auth/tokenValidation.js";

const authRoutes = express.Router();

authRoutes.post("/book", auth ,book);
authRoutes.get("/my-appointments", auth, myAppointments);
authRoutes.put("/cancel/:id", auth, cancel);

export default authRoutes;