// controllers/exportController.js
import ExcelJS from 'exceljs';
import Attendance from '../models/Attendance.js';
import LeaveRequest from '../models/LeaveRequest.js';
import User from '../models/User.js';

export const exportTeamAttendanceAndLeaves = async (req, res) => {
  try {
    const adminEmail = req.user?.email; // from your protect middleware
    if (!adminEmail) {
      return res.status(401).json({ message: 'Unauthorized: admin email missing' });
    }

    // 1) Team members under this admin
    const teamMembers = await User.find(
      { under_admin: adminEmail },
      '_id name email'
    ).lean();

    if (!teamMembers.length) {
      return res.status(404).json({ message: 'No team members found under this admin.' });
    }

    const emailList = teamMembers
      .map(m => (m.email || '').toLowerCase())
      .filter(Boolean);
    const idList = teamMembers.map(m => m._id.toString());

    // quick lookups for names
    const nameByEmail = new Map(teamMembers.map(m => [String(m.email).toLowerCase(), m.name || '']));
    const nameById = new Map(teamMembers.map(m => [m._id.toString(), m.name || '']));

    // 2) Fetch Attendance + Leaves for those members (parallel)
    const [attendanceData, leaveData] = await Promise.all([
      Attendance.find({ email: { $in: emailList } }).sort({ date: 1 }).lean(),
      LeaveRequest.find({
        $or: [
          { email: { $in: emailList } },
          { user: { $in: idList } }
        ]
      }).sort({ date: 1 }).lean()
    ]);

    // 3) Build workbook
    const workbook = new ExcelJS.Workbook();

    // ---- Attendance sheet ----
    const wsA = workbook.addWorksheet('Attendance');

    wsA.columns = [
      { header: 'Name', key: 'name', width: 22 },
      { header: 'Email', key: 'email', width: 28 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Time In', key: 'timeIn', width: 20 },
      { header: 'Time Out', key: 'timeOut', width: 20 },
      { header: 'In Description', key: 'inDescription', width: 30 },
      { header: 'Out Description', key: 'outDescription', width: 30 },
      { header: 'Leave Description', key: 'leaveDescription', width: 30 },
    ];

    // Add attendance rows (use real Date objects so Excel sorts properly)
    attendanceData.forEach(r => {
      const email = (r.email || '').toLowerCase();
      wsA.addRow({
        name: nameByEmail.get(email) || 'N/A',
        email: r.email || 'N/A',
        date: r.date ? new Date(r.date) : '',
        status: r.status || '',
        timeIn: r.timeIn ? new Date(r.timeIn) : '',
        timeOut: r.timeOut ? new Date(r.timeOut) : '',
        inDescription: r.inDescription || '',
        outDescription: r.outDescription || '',
        leaveDescription: r.description || '',
      });
    });

    // Format header + date/time columns
    wsA.getRow(1).font = { bold: true };
    wsA.getColumn('date').numFmt = 'yyyy-mm-dd';
    wsA.getColumn('timeIn').numFmt = 'hh:mm:ss';
    wsA.getColumn('timeOut').numFmt = 'hh:mm:ss';
    wsA.autoFilter = { from: 'A1', to: 'I1' };
    wsA.views = [{ state: 'frozen', ySplit: 1 }];

    // ---- Leaves sheet ----
    const wsL = workbook.addWorksheet('Leaves');

    wsL.columns = [
      { header: 'Name', key: 'name', width: 22 },
      { header: 'Email', key: 'email', width: 28 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Status', key: 'status', width: 14 }, // pending/approved/rejected/expired
      { header: 'Reason', key: 'reason', width: 40 },
      { header: 'Created At', key: 'createdAt', width: 22 },
    ];

    leaveData.forEach(r => {
      const email = (r.email || '').toLowerCase();
      const nameFromEmail = nameByEmail.get(email);
      const nameFromId = r.user ? nameById.get(String(r.user)) : undefined;

      wsL.addRow({
        name: nameFromEmail || nameFromId || 'N/A',
        email: r.email || 'N/A',
        date: r.date ? new Date(r.date) : '',
        status: r.status || '',
        reason: r.reason || '',
        createdAt: r.createdAt ? new Date(r.createdAt) : '',
      });
    });

    wsL.getRow(1).font = { bold: true };
    wsL.getColumn('date').numFmt = 'yyyy-mm-dd';
    wsL.getColumn('createdAt').numFmt = 'yyyy-mm-dd hh:mm:ss';
    wsL.autoFilter = { from: 'A1', to: 'F1' };
    wsL.views = [{ state: 'frozen', ySplit: 1 }];

    // 4) Stream to client
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=team_attendance_leaves.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to export team data' });
  }
};
