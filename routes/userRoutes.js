import express from 'express';
import User from '../models/User.js'; // include `.js` for ES Modules

const router = express.Router();

// GET all users
router.get('/', (req, res) => {
  res.send('Users route working!');
});

// POST new user
router.post('/', async (req, res) => {
  const { name, email } = req.body;
  const newUser = new User({ name, email });
  await newUser.save();
  res.json(newUser);
});

export default router;
