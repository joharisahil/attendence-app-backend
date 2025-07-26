import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Admin from '../models/Admin.js';

// 📊 1. Get Dashboard Stats
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'team' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalAttendanceRecords = await Attendance.countDocuments();

    res.json({
      totalUsers,
      totalAdmins,
      totalAttendanceRecords,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
};

// 📅 2. Get All Team Attendance
export const getAllTeamAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find();
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching attendance logs' });
  }
};

// 👤 3. Admin Profile
export const adminProfile = async (req, res) => {
  try {
    // Try fetching from User collection first
    let admin = await User.findOne({ email: req.user.email }).select('-password');

    // If not found, check Admin collection (if you use it)
    if (!admin) {
      admin = await Admin.findOne({ email: req.user.email }).select('-password');
    }

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    res.status(200).json(admin);
  } catch (err) {
    console.error('Error fetching admin profile:', err);
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

// ✏️ 4. Update Admin Profile
export const updateAdminProfile = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await User.findById(req.user.id);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (email) admin.email = email;
    if (password) admin.password = password;

    await admin.save();

    res.json({ message: 'Admin profile updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile' });
  }
};