import express from 'express';
import { registerUser, loginUser ,forgotPassword , resetPassword} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerUser);  // Only first admin can register
router.post('/login', loginUser);        // Admin and team login
// POST: Send reset password token (frontend will email it)
router.post('/forgot-password', forgotPassword);

// POST: Reset the password using token and new password
router.post('/reset-password', resetPassword);

export default router;
