import express from 'express';

import {particularFunction} from "../controllers/testControllers.js"
const router = express.Router();

router.get("/test",particularFunction);


export default router; 