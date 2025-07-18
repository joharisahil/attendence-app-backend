import express from 'express';
import {  addTeamMember} from '../controllers/teamController.js';
import{ markIn,
  markOut,
  markLeave} from '../controllers/statusController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/add', protect, adminOnly, addTeamMember); // ✅ This must exist

router.post('/in', protect, markIn);
router.post('/out', protect, markOut);
router.post('/leave', protect, markLeave);

export default router;