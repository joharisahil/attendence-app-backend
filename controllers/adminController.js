import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
import Admin from '../models/Admin.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';


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

// POST /auth/forgot-password (Admin version)
export const forgotPassword_admin = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await Admin.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    res.status(200).json({ token }); // front-end will use this to send the email
  } catch (err) {
   console.error("Error generating reset token:", err);
    res.status(500).json({ message: 'Error generating reset token' });
  }
};
export const resetPassword_admin = async (req, res) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get new password from request body
    const { newPassword } = req.body;
    //console.log("this is new password", newPassword);

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    // Find admin
    const user = await Admin.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    //console.log("this is user", user);

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(400).json({ message: "Invalid or expired token" });
  }
};