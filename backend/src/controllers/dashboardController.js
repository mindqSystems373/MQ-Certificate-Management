const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const Student = require('../models/Student');
const Certificate = require('../models/Certificate');
const ActivityLog = require('../models/ActivityLog');

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// One summary shape serves both dashboards: Super Admin's "Dashboard Cards" and
// Management's "Total/Issued/Pending Records" are the same underlying numbers,
// just labeled differently in the UI per the PRD.
const summary = asyncHandler(async (req, res) => {
  const [totalStudents, issuedCount, pendingCount, todayCount, monthCount] = await Promise.all([
    Student.countDocuments(),
    Student.countDocuments({ status: 'issued' }),
    Student.countDocuments({ status: 'pending' }),
    Certificate.countDocuments({ issueDate: { $gte: startOfToday() } }),
    Certificate.countDocuments({ issueDate: { $gte: startOfMonth() } }),
  ]);

  sendSuccess(res, 200, 'Dashboard summary', {
    totalRecords: totalStudents,
    totalStudents,
    issuedRecords: issuedCount,
    pendingRecords: pendingCount,
    certificatesToday: todayCount,
    certificatesThisMonth: monthCount,
  });
});

const latestCertificates = asyncHandler(async (req, res) => {
  const limit = Math.min(50, Number(req.query.limit) || 5);
  const items = await Certificate.find()
    .populate('student', 'fullName email')
    .populate('course', 'name')
    .sort({ issueDate: -1 })
    .limit(limit);
  sendSuccess(res, 200, 'Latest certificates', items);
});

const recentActivity = asyncHandler(async (req, res) => {
  const limit = Math.min(100, Number(req.query.limit) || 10);
  const items = await ActivityLog.find().sort({ createdAt: -1 }).limit(limit);
  sendSuccess(res, 200, 'Recent activity', items);
});

module.exports = { summary, latestCertificates, recentActivity };
