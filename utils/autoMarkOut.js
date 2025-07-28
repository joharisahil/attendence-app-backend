// cronJobs/autoMarkOut.js
import cron from 'node-cron';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import { getIsTTime } from '../utils/getISTDate.js';

// Runs every day at 11:59 PM IST
cron.schedule('29 18 * * *', async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const startOfDay = new Date(today);
    const endOfDay = new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000);

    // Find all IN users who haven't marked OUT
    const pendingOuts = await Attendance.find({
      date: { $gte: startOfDay, $lt: endOfDay },
      status: 'in',
    });

    for (const record of pendingOuts) {
      const email = record.email;
      const currentTime = getIsTTime();

      // Update attendance
      record.status = 'out';
      record.timeOut = currentTime;
      record.outDescription = 'Auto-marked OUT due to inactivity';
      await record.save();

      // Update user status
      await User.findOneAndUpdate(
        { email },
        {
          $set: {
            status: 'out',
            outTime: currentTime,
          },
        }
      );

      console.log(`Auto-marked OUT for ${email}`);
    }
  } catch (err) {
    console.error('Auto-mark-out failed:', err);
  }
});
