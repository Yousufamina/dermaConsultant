import express from "express";
import twilio from "twilio";
import { request, verify, completeProfile } from "../controller/authController.js";

const authRoutes = express.Router();

authRoutes.post("/request", request);
authRoutes.post("/verify", verify);
authRoutes.post("/profile/complete", completeProfile);


export default authRoutes;