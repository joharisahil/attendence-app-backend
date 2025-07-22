import express from 'express';
import {
  markIn,
  markOut,
  markLeave
} from '../controllers/attendanceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All attendance routes are protected
router.post('/in', protect, markIn);
router.post('/out', protect, markOut);
router.post('/leave', protect, markLeave);

export default router;
