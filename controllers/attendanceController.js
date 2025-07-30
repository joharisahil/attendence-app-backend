
// 📌 MARK IN
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';

export const markIn = async (req, res) => {
  try {
    const { email } = req.user;
    const { description } = req.body;

    const user = await User.findOne({ email }) || await Admin.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const now = new Date(); // store full Date object
    const todayDate = now.toISOString().split('T')[0]; // yyyy-mm-dd

    const alreadyMarked = await Attendance.findOne({ email, date: todayDate });
    if (alreadyMarked) {
      return res.status(400).json({ message: 'Already marked IN for today' });
    }

    const attendance = new Attendance({
      email,
      date: todayDate,
      status: 'in',
      timeIn: now, // store full date-time
      inDescription: description || '',
    });

    await attendance.save();

    await User.findOneAndUpdate(
      { email },
      {
        $set: {
          status: 'in',
          inTime: now, // also full date-time
          outTime: null,
        },
      }
    );

    res.status(200).json({
      message: 'Marked IN successfully',
      time: now,
      inDescription: description || 'empty',
    });

  } catch (err) {
    console.error('Error marking IN:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// 📌 MARK OUT
export const markOut = async (req, res) => {
  try {
    const { email } = req.user;
    const { description } = req.body;

    const today = new Date().toISOString().split('T')[0]; // 'yyyy-mm-dd'
    
    const attendance = await Attendance.findOne({
      email,
      date: today, // directly matching the `yyyy-mm-dd` string
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

    const now = new Date(); // 🕒 full Date object

    attendance.status = 'out';
    attendance.timeOut = now;
    attendance.outDescription = description || 'empty';
    await attendance.save();

    await User.findOneAndUpdate(
      { email },
      {
        $set: {
          status: 'out',
          outTime: now,
        }
      }
    );

    res.status(200).json({
      message: 'Status marked as OUT',
      timeOut: now,
      outDescription: description || '',
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
