import express from 'express';

import { registerUser} from '../controllers/emailauthControllers.js';
import { loginUser } from '../controllers/emailauthControllers.js';




const router = express.Router();


//User registration end point
router.post('/register',registerUser);
// Login endpoint
router.post('/login',loginUser);





export default router; 