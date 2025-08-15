import express from 'express';
import {
  getDashboardStats,
  getAllTeamAttendance,
  adminProfile,
  updateAdminProfile,
  forgotPassword_admin,
  resetPassword_admin
} from '../controllers/adminController.js';
import { getPendingLeaveRequests } from '../controllers/leaveController.js';
import { protect , isAdmin} from '../middleware/authMiddleware.js';
import { exportTeamAttendanceAndLeaves } from '../controllers/exportController.js';
const router = express.Router();

// Apply both protect and isAdmin for all routes
router.use(protect);
router.use(isAdmin);

router.get('/stats', protect, isAdmin, getDashboardStats);
router.get('/attendance', protect, isAdmin, getAllTeamAttendance);
router.get('/profile', protect, isAdmin, adminProfile);
router.put('/profile/update', protect, isAdmin, updateAdminProfile);
router.get('/pending', protect, getPendingLeaveRequests);
router.post('/forgot-password-admin', forgotPassword_admin);
// POST: Reset the password using token and new password
router.post('/reset-password-admin', resetPassword_admin);
router.post('/export-attendance', protect, isAdmin, exportTeamAttendanceAndLeaves);

export default router;
