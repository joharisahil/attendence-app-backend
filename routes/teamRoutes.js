import express from 'express';
import {
  markIn,
  markOut,
  applyLeave,
} from '../controllers/teamController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes are protected
router.post('/in', protect, markIn);
router.post('/out', protect, markOut);
router.post('/leave', protect, applyLeave);

export default router;
