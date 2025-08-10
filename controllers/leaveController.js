import LeaveRequest from '../models/LeaveRequest.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';
// Request Leave
export const requestLeave = async (req, res) => {
  try {
    const { email, date, reason } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check for existing leave by email instead of ObjectId
    const existingLeave = await LeaveRequest.findOne({
      email: email,
      date: new Date(date)
    });

    if (existingLeave) {
      return res.status(400).json({ message: 'Leave request for this date already exists' });
    }

    const leaveRequest = new LeaveRequest({
      user: user._id, // still storing for reference
      email: user.email, // new field for direct lookup
      date: new Date(date),
      reason,
      status: 'pending'
    });

    await leaveRequest.save();

    res.status(201).json({
      message: 'Leave request submitted successfully',
      leaveRequest
    });
  } catch (error) {
    console.error('Error requesting leave:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Approve Leave
export const approveLeave = async (req, res) => {
  try {
    const { email, date, description } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const leaveRequest = await LeaveRequest.findOne({
      email,
      date: new Date(date)
    });

    if (!leaveRequest) return res.status(404).json({ message: 'Leave request not found' });
    if (leaveRequest.status === 'approved') {
      return res.status(400).json({ message: 'Leave already approved' });
    }

    // ✅ Approve leave request
    leaveRequest.status = 'approved';
    await leaveRequest.save();

    // ✅ Update user status
    user.status = 'leave';
    await user.save();

    // ✅ Create attendance record
    const leaveDate = new Date(date);
    const startOfDay = new Date(leaveDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(leaveDate.setHours(23, 59, 59, 999));

    // Prevent duplicate attendance entry
    const existingAttendance = await Attendance.findOne({
      email,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (!existingAttendance) {
      const attendance = new Attendance({
        email,
        date: startOfDay,
        status: 'leave',
        description: description || leaveRequest.reason
      });
      await attendance.save();
    }

    res.status(200).json({ 
      message: 'Leave approved and attendance updated successfully', 
      leaveRequest 
    });

  } catch (error) {
    console.error('Error approving leave:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reject Leave
export const rejectLeave = async (req, res) => {
  try {
    const { email, date } = req.body;

    const leaveRequest = await LeaveRequest.findOne({
      email: email,
      date: new Date(date)
    });

    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (leaveRequest.status === 'rejected') {
      return res.status(400).json({ message: 'Leave already rejected' });
    }

    leaveRequest.status = 'rejected';
    await leaveRequest.save();

    // Reset user's status to 'none'
    await User.findOneAndUpdate({ email: email }, { status: 'none' });

    res.status(200).json({ message: 'Leave rejected successfully', leaveRequest });
  } catch (error) {
    console.error('Error rejecting leave:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
