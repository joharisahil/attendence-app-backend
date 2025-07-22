// controllers/userController.js
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';

// ✅ Get logged-in user profile
export const getUserProfile = (req, res) => {
  res.json({
    message: 'User profile accessed successfully',
    user: req.user, // Comes from authMiddleware
  });
};

// ✅ Update user profile (only password)
/*export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { password } = req.body;
    if (password) {
      user.password = password;
      await user.save();
      return res.json({ message: 'Password updated successfully' });
    }

    res.status(400).json({ message: 'No password provided to update' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating password' });
  }
};
*/


// ✅ Get logged-in user's attendance history
export const getMyAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching attendance records' });
  }
};

// ✅ (Optional) Get today’s status
export const getMyStatusToday = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await Attendance.findOne({
      user: req.user.id,
      createdAt: { $gte: today },
    });

    if (!record) {
      return res.json({ status: 'Not marked yet today' });
    }

    res.json({
      status: record.status,
      timestamp: record.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error checking today\'s status' });
  }
};
