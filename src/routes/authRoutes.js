import express from "express";
import { completeUserProfile, deleteUser , getUsers , getUserDetail, googleLogin} from "../controller/authController.js";

const authRoutes = express.Router();

authRoutes.post("/googleLogin", googleLogin);
// authRoutes.post("/request", request);
// authRoutes.post("/verify", verify);
authRoutes.post("/profile/complete", completeUserProfile);
authRoutes.get("/deleteUser/:id", deleteUser);
authRoutes.get("/users", getUsers);
authRoutes.get("/user/:id", getUserDetail);

export default authRoutes;