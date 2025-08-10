// cronJobs/expireLeaveRequests.js
import cron from 'node-cron';
import LeaveRequest from '../models/LeaveRequest.js';

cron.schedule('0 0 * * *', async () => { // runs every midnight
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await LeaveRequest.updateMany(
      { status: 'pending', date: { $lt: today } },
      { $set: { status: 'expired' } }
    );

    if (result.modifiedCount > 0) {
      console.log(`Expired ${result.modifiedCount} leave requests.`);
    }
  } catch (err) {
    console.error('Error expiring leave requests:', err);
  }
});
