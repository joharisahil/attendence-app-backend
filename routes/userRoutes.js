// routes/userRoutes.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getUserProfile,
  //getMyAttendance,
  getMyStatusToday,
  getStarEmployeesForUser
} from '../controllers/userController.js';

const router = express.Router();

// Protected routes for logged-in users
router.get('/profile', protect, getUserProfile);              // Get user profile
//router.put('/update-password', protect, updateUserProfile);   // Update only password
router.get('/status/today', protect, getMyStatusToday);       // Today's status
router.get('/starforuser', protect, getStarEmployeesForUser); //fetch star employe for the user
export default router;
