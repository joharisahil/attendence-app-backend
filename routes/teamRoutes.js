import express from 'express';
import {
  addTeamMember,
  getTeamMembers,
  removeTeamMember,
  editTeamMember,
  getTeamMemberAttendance
} from '../controllers/teamController.js';

import { protect, isAdmin } from '../middleware/authMiddleware.js';
import { toggleStarEmployee, getStarEmployees } from '../controllers/teamController.js';


//import { protect, adminOnly } from '../middleware/authMiddleware.js';
const router = express.Router();

// All routes below are protected and admin-only

// ➕ Add a new team member
router.post('/add', protect, isAdmin, addTeamMember);

// 📄 View all team members
router.get('/all', protect, isAdmin, getTeamMembers);

// 🗑️ Remove a team member by email
router.delete('/remove', protect, isAdmin, removeTeamMember);

// 📝 Edit a team member (email/role) by ID
//router.put('/edit', protect, isAdmin, editTeamMember);

// 📅 Get attendance of a specific team member by ID
router.post('/attendance', protect, isAdmin, getTeamMemberAttendance);


// Route: PATCH /api/team/star/:userId
router.patch('/star', protect, isAdmin, toggleStarEmployee);

// Get all star employees (admin only)
router.get('/stars', protect,isAdmin, getStarEmployees);

export default router;
