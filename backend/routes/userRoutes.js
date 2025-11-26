import express from 'express';
import { getUserProfile } from '../controllers/userControllers.js';

const router = express.Router();

router.get('/profile/:userId', getUserProfile);

export default router;