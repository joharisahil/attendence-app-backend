import User from '../models/User.js';

console.log("this is working");
export const markIn = async (req, res) => {
  try {
    const { id } = req.user; // Coming from auth middleware
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.status = 'in';
    user.lastStatusUpdate = new Date();
    await user.save();

    res.json({ message: 'Status marked as IN', time: user.lastStatusUpdate });
  } catch (err) {
    console.error('Error marking IN:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const markOut = async (req, res) => {
  try {
    const { id } = req.user;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.status = 'out';
    user.lastStatusUpdate = new Date();
    await user.save();

    res.json({ message: 'Status marked as OUT', time: user.lastStatusUpdate });
  } catch (err) {
    console.error('Error marking OUT:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const markLeave = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const existing = await Status.findOne({
      user: req.user._id,
      date: today,
    });

    if (existing) {
      existing.status = 'leave';
      await existing.save();
    } else {
      const status = new Status({
        user: req.user._id,
        status: 'leave',
        date: today,
      });
      await status.save();
    }

    res.status(200).json({ message: 'Marked as on leave' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking leave', error: error.message });
  }
};
