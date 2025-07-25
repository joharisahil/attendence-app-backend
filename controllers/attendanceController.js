import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

console.log("Attendance controller active");

// 📌 MARK IN
export const markIn = async (req, res) => {
  try {
    const { email } = req.user;
    const { description } = req.body;

    // Find user (either team or admin)
    const isUserPresent = await User.findOne({ email }) || await Admin.findOne({ email });
    if (!isUserPresent) {
      return res.status(404).json({ message: 'User not found' });
    }

    const today = new Date().toISOString().split('T')[0];

    // ✅ Check if already marked today
    const existing = await Attendance.findOne({ email, date: today });
    if (existing) {
      return res.status(400).json({ message: 'Already marked attendance today.' });
    }

    // ✅ Create attendance record using email
    const attendance = new Attendance({
      email, // store email instead of user ID
      date: today,
      status: 'in',
      timeIn: new Date(),
      description,
    });

    await attendance.save();

    res.status(200).json({
      message: 'Status marked as IN',
      time: attendance.timeIn,
      description,
    });

  } catch (err) {
    console.error('Error marking IN:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 📌 MARK OUT
export const markOut = async (req, res) => {
  try {
    const { email } = req.user; // Extracted from JWT
    const { description } = req.body;

    const today = new Date().toISOString().split('T')[0];

    // Find today's attendance for this email
    const attendance = await Attendance.findOne({
      email,
      date: { $gte: new Date(today), $lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000) },
    });

    if (!attendance) {
      return res.status(400).json({ message: 'You must mark IN before marking OUT' });
    }

    if (attendance.status === 'leave') {
      return res.status(400).json({ message: 'You are on LEAVE today. Cannot mark OUT.' });
    }

    if (attendance.status === 'out') {
      return res.status(400).json({ message: 'You have already marked OUT today.' });
    }

    if (attendance.status !== 'in') {
      return res.status(400).json({ message: 'You must mark IN before marking OUT' });
    }

    attendance.status = 'out';
    attendance.timeOut = new Date();
    attendance.description = description;

    await attendance.save();

    res.status(200).json({
      message: 'Status marked as OUT',
      timeOut: attendance.timeOut,
      description,
    });
  } catch (err) {
    console.error('Error marking OUT:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


// 📌 MARK LEAVE
export const markLeave = async (req, res) => {
  try {
    const { email } = req.user;
    const { description, date } = req.body;

    const leaveDate = date ? new Date(date) : new Date(); // Use provided or default to today
    const startOfDay = new Date(leaveDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(leaveDate.setHours(23, 59, 59, 999));

    const existing = await Attendance.findOne({
      email,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existing) {
      return res.status(400).json({ message: 'You have already marked attendance on this date.' });
    }

    const leave = new Attendance({
      email,
      date: startOfDay,
      status: 'leave',
      description,
    });

    await leave.save();

    res.status(200).json({ message: 'Marked as on leave', description });
  } catch (error) {
    console.error('Error marking LEAVE:', error);
    res.status(500).json({ message: 'Server error' });
  }
};