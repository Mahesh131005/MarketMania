import express from "express";
import { googleAuth, googleAuthCallback } from "../controllers/googleauthControllers.js";

const router = express.Router();

// Google authentication routes
router.get('/google', googleAuth);
router.get('/google/callback', googleAuthCallback);

export default router;