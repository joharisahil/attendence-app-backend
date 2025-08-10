import express from 'express';
import { requestLeave, approveLeave, rejectLeave } from '../controllers/leaveController.js';
import { protect,isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Request leave (any authenticated user)
router.post('/request', protect, requestLeave);

// Approve leave (admin only)
router.patch('/approve', protect, isAdmin, approveLeave);

// Reject leave (admin only)
router.patch('/reject', protect, isAdmin, rejectLeave);

export default router;
