// cronJobs/autoMarkOut.js
import cron from 'node-cron';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';

// Runs every day at 11:59 PM IST (which is 18:29 UTC)
cron.schedule('29 18 * * *', async () => {
  try {
    const today = new Date().toISOString().split('T')[0]; // 'yyyy-mm-dd'
    const now = new Date(); // full Date object

    // Find all IN users who haven't marked OUT today
    const pendingOuts = await Attendance.find({
      date: today,
      status: 'in',
    });

    for (const record of pendingOuts) {
      const email = record.email;

      // Update attendance
      record.status = 'out';
      record.timeOut = now;
      record.outDescription = 'Auto-marked OUT due to inactivity';
      await record.save();

      // Update user status
      await User.findOneAndUpdate(
        { email },
        {
          $set: {
            status: 'out',
            outTime: now,
          },
        }
      );

      console.log(`✅ Auto-marked OUT for ${email}`);
    }

  } catch (err) {
    console.error('❌ Auto-mark-out failed:', err);
  }
});
