import express from 'express';
import {
  getDashboardStats,
  getAllTeamAttendance,
  adminProfile,
  updateAdminProfile
} from '../controllers/adminController.js';
import { getPendingLeaveRequests } from '../controllers/leaveController.js';
import { protect , isAdmin} from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply both protect and isAdmin for all routes
router.use(protect);
router.use(isAdmin);

router.get('/stats', protect, isAdmin, getDashboardStats);
router.get('/attendance', protect, isAdmin, getAllTeamAttendance);
router.get('/profile', protect, isAdmin, adminProfile);
router.put('/profile/update', protect, isAdmin, updateAdminProfile);
router.get('/pending', protect, getPendingLeaveRequests);
export default router;
