// controllers/userController.js
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';

// ✅ Get logged-in user profile


export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User profile accessed successfully',
      user,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
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


export const getMyStatusToday = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find the latest attendance record for this user
    const latestAttendance = await Attendance.findOne({ user: userId })
      .sort({ createdAt: -1 });

    if (!latestAttendance) {
      return res.json({ status: 'idle' });
    }

    // Get today's date in simple format
    const today = new Date().toDateString();

    // Check for leave status first
    if (
      latestAttendance.status === 'leave' &&
      new Date(latestAttendance.createdAt).toDateString() === today
    ) {
      return res.json({ status: 'leave' });
    }

    // If OUT status and not today → idle
    if (
      latestAttendance.status === 'out' &&
      new Date(latestAttendance.outTime).toDateString() !== today
    ) {
      return res.json({ status: 'idle' });
    }

    // If IN/OUT/LEAVE is from today → return it, else idle
    if (new Date(latestAttendance.createdAt).toDateString() === today) {
      return res.json({ status: latestAttendance.status });
    }

    return res.json({ status: 'idle' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};


export const getStarEmployeesForUser = async (req, res) => {
  try {
    const userEmail = req.user.email;

    // Fetch the current user's record to get their associated admin
    const currentUser = await User.findOne({ email: userEmail });

    if (!currentUser || currentUser.role !== 'team') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const adminEmail = currentUser.under_admin; // assuming this is the reference field

    // Find all star employees under the same admin
    const starEmployees = await User.find({
      isStarEmployee: true,
      role: 'team',
      under_admin: adminEmail,
    }).select('-password');

    res.status(200).json(starEmployees);
  } catch (err) {
    console.error('Error fetching star employees for user:', err);
    res.status(500).json({ message: 'Server error fetching star employees' });
  }
};
