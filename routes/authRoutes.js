import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerUser);  // Only first admin can register
router.post('/login', loginUser);        // Admin and team login

export default router;
