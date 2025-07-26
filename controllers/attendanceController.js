import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import { getIsTDate } from '../utils/timeUtils.js'; // Make sure this is imported


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
    const currentTime = getIsTDate(); // ✅ define currentTime in IST


    // ✅ Create attendance record using email
    const attendance = new Attendance({
      email, // store email instead of user ID
      date: today,
      status: 'in',
      timeIn: currentTime,
      inDescription : description,
    });

    await attendance.save();
     // ✅ Update user's status and inTime
    await User.findOneAndUpdate(
      { email },
      {
        $set: {
          status: 'in',
          inTime: currentTime,
          outTime: null,
        }
      }
    );

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
    const { email } = req.user;
    const { description } = req.body;

    const today = new Date().toISOString().split('T')[0];

    const startOfDay = new Date(today);
    const endOfDay = new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000);

    // Find today's attendance
    const attendance = await Attendance.findOne({
      email,
      date: { $gte: startOfDay, $lt: endOfDay },
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

   const currentTime = getIsTDate(); // ✅ define currentTime in IST


    // ✅ Update attendance
    attendance.status = 'out';
    attendance.timeOut = currentTime;
    attendance.outDescription = description; // ✅ use correct field
    await attendance.save();

    // ✅ Update user status and outTime
    await User.findOneAndUpdate(
      { email },
      {
        $set: {
          status: 'out',
          outTime: currentTime,
        }
      }
    );

    res.status(200).json({
      message: 'Status marked as OUT',
      timeOut: currentTime,
      outDescription: description,
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

    const leaveDate = date ? new Date(date) : new Date();

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
      description, // ✅ Used only for leave
    });

    await leave.save();

    // ✅ Update user status
    await User.findOneAndUpdate(
      { email },
      {
        $set: { status: 'leave' }
      }
    );

    res.status(200).json({
      message: 'Marked as on leave',
      description
    });

  } catch (error) {
    console.error('Error marking LEAVE:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
