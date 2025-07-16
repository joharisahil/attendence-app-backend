import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// GET all users
router.get('/', (req, res) => {
  res.send('Users route working!');
});

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
