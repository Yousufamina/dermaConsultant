import express from "express";
import { request, verify, completeProfile, deleteUser , getUsers } from "../controller/authController.js";

const authRoutes = express.Router();

authRoutes.post("/request", request);
authRoutes.post("/verify", verify);
authRoutes.post("/profile/complete", completeProfile);
authRoutes.get("/deleteUser/:id", deleteUser);
authRoutes.get("/users", getUsers);



export default authRoutes;