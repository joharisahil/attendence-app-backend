import express from 'express';
import User from '../models/User.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js'; 
import asyncHandler from 'express-async-handler';
const router = express.Router();

// GET all users
router.get('/all', protect, authorizeRoles('admin'), asyncHandler(async (req, res) => {
  const users = await User.find().select('-password'); // exclude passwords
  res.json(users);
}));

router.get('/profile', protect, authorizeRoles('user', 'admin'), (req, res) => {
  res.json({ message: `Hello, ${req.user.role}` });
});

// POST new user
router.post('/', async (req, res) => {
  const { name, email } = req.body;
  const newUser = new User({ name, email });
  await newUser.save();
  res.json(newUser);
});

export default router;
