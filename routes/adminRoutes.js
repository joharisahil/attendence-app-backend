import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, adminOnly, (req, res) => {
  res.send('Welcome Admin!');
});

export default router;
