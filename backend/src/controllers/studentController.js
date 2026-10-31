const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/ApiResponse');
const Student = require('../models/Student');
const Certificate = require('../models/Certificate');
const Course = require('../models/Course');
const Faculty = require('../models/Faculty');
const Grade = require('../models/Grade');
const Settings = require('../models/Settings');
const ActivityLog = require('../models/ActivityLog');
const { getNextCertificateNumber } = require('../services/certificateNumberService');
const { sendAcknowledgmentEmail, sendCertificateIssuedEmail } = require('../services/emailService');
const defaultTemplate = require('../templates/defaultTemplate');

// Only used as a last-resort fallback — see buildUrls() below, which derives
// both URLs from the actual request instead, so renaming either Vercel
// project's domain never breaks these links again.
const FRONTEND_URL_FALLBACK = (process.env.FRONTEND_URL || 'https://mindq-certificate-frontend.vercel.app').replace(/\/$/, '');

// The backend's own URL is always exactly the host this very request came in
// on — Vercel's proxy headers make req.protocol/req.get('host') accurate
// (see app.set('trust proxy', 1) in app.js), so there's nothing to configure
// or ever get stale.
//
// The frontend's URL can't be derived the same way — this is a different
// Vercel project/domain — but when this request came from the actual admin
// dashboard (every approve/resend call does; it's a fetch() from the SPA),
// the browser's own Origin header already carries the frontend's current,
// real domain. Using that means a certificate approved right after renaming
// the frontend's domain automatically gets the new domain baked into its
// verification link — no env var to remember to update. This value then
// gets stored on the certificate (qrPayload) and reused for that
// certificate's QR/verify link forever after, exactly like its download PDF
// never changes once issued.
function buildUrls(req) {
  const backendUrl = `${req.protocol}://${req.get('host')}`.replace(/\/$/, '');
  const frontendUrl = (req.get('origin') || FRONTEND_URL_FALLBACK).replace(/\/$/, '');
  return { backendUrl, frontendUrl };
}

async function nextStudentId() {
  const counter = await Settings.findOneAndUpdate(
    { key: 'studentCounter' },
    { $inc: { 'value.sequence': 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return `STU${String(counter.value.sequence).padStart(6, '0')}`;
}

/**
 * Submit -> Save MongoDB as 'pending' -> acknowledgment email -> wait for
 * Management approval. Certificate generation now happens later, in
 * approveStudents below, once Management has reviewed and approved the
 * submission — the two are no longer the same step.
 */
const createStudent = asyncHandler(async (req, res) => {
  const { fullName, guardianName, email, phone, course, faculty, grade, startDate, endDate } = req.body;

  const [courseDoc, facultyDoc, gradeDoc] = await Promise.all([
    Course.findOne({ _id: course, isActive: true }),
    Faculty.findOne({ _id: faculty, isActive: true }),
    Grade.findOne({ _id: grade, isActive: true }),
  ]);
  if (!courseDoc) throw new ApiError(400, 'Selected course does not exist or is inactive');
  if (!facultyDoc) throw new ApiError(400, 'Selected faculty does not exist or is inactive');
  if (!gradeDoc) throw new ApiError(400, 'Selected grade does not exist or is inactive');

  if (new Date(endDate) <= new Date(startDate)) {
    throw new ApiError(400, 'End date must be after start date');
  }

  const studentId = await nextStudentId();

  const student = await Student.create({
    studentId,
    fullName,
    guardianName,
    email,
    phone,
    course: courseDoc._id,
    faculty: facultyDoc._id,
    grade: gradeDoc._id,
    startDate,
    endDate,
    status: 'pending',
    createdBy: req.admin._id,
  });

  await ActivityLog.create({
    type: 'student_submitted',
    actor: req.admin._id,
    actorName: req.admin.name,
    description: `${req.admin.name} submitted ${fullName} for certificate approval`,
    meta: { studentId: student._id },
  });

  // Best-effort: a mail hiccup shouldn't fail the submission itself — the
  // student record (and Management's pending queue) is already saved either way.
  try {
    await sendAcknowledgmentEmail({ to: email, studentName: fullName });
  } catch (err) {
    console.error('Acknowledgment email failed:', err.message);
  }

  sendSuccess(res, 201, 'Details sent to management for approval', { student });
});

/**
 * Management approves one or more pending students at once: allocates each
 * one's certificate number, records the Certificate (data only — no PDF is
 * generated or stored here, or anywhere; see pdfService.js), flips the
 * Student to 'issued', and emails the full download/verify details. Runs
 * sequentially per student so certificate numbers — allocated atomically one
 * at a time — stay strictly in order.
 */
const approveStudents = asyncHandler(async (req, res) => {
  const { studentIds } = req.body;
  const { backendUrl, frontendUrl } = buildUrls(req);

  const templateSetting = await Settings.findOne({ key: 'certificateTemplate' });
  const template = templateSetting?.value || defaultTemplate;

  const approved = [];
  const failed = [];

  for (const studentId of studentIds) {
    try {
      const student = await Student.findById(studentId).populate('course faculty grade');
      if (!student) throw new ApiError(404, 'Student not found');
      if (student.status !== 'pending') throw new ApiError(400, `${student.fullName} is not pending approval`);

      const certificateNumber = await getNextCertificateNumber();
      const issueDate = new Date();
      const verifyUrl = `${frontendUrl}/verification?number=${encodeURIComponent(certificateNumber)}`;

      const certificate = await Certificate.create({
        certificateNumber,
        student: student._id,
        course: student.course._id,
        faculty: student.faculty._id,
        grade: student.grade._id,
        studentNameSnapshot: student.fullName,
        guardianNameSnapshot: student.guardianName,
        courseNameSnapshot: student.course.name,
        facultyNameSnapshot: student.faculty.name,
        gradeLabelSnapshot: student.grade.label,
        startDate: student.startDate,
        endDate: student.endDate,
        templateVersion: template.version,
        issueDate,
        qrPayload: verifyUrl,
        createdBy: req.admin._id,
      });

      student.certificateNumber = certificateNumber;
      student.certificateTemplateVersion = template.version;
      student.certificatePDF = true;
      student.status = 'issued';
      await student.save();

      await ActivityLog.create({
        type: 'certificate_approved',
        actor: req.admin._id,
        actorName: req.admin.name,
        description: `${req.admin.name} approved and issued certificate ${certificateNumber} for ${student.fullName}`,
        meta: { certificateNumber, studentId: student._id },
      });

      try {
        await sendCertificateIssuedEmail({
          to: student.email,
          studentName: student.fullName,
          email: student.email,
          phone: student.phone,
          courseName: student.course.name,
          facultyName: student.faculty.name,
          certificateNumber,
          downloadUrl: `${backendUrl}/api/public/certificates/${certificateNumber}/download`,
          verifyUrl,
        });
      } catch (err) {
        console.error('Certificate-issued email failed:', err.message);
      }

      approved.push({ studentId, certificateNumber, fullName: student.fullName });
    } catch (err) {
      failed.push({ studentId, message: err.message });
    }
  }

  sendSuccess(res, 200, `${approved.length} certificate(s) issued${failed.length ? `, ${failed.length} failed` : ''}`, {
    approved,
    failed,
  });
});

const listStudents = asyncHandler(async (req, res) => {
  const { q, course, faculty, status, dateFrom, dateTo, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (q) {
    filter.$or = [
      { fullName: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } },
      { certificateNumber: { $regex: q, $options: 'i' } },
    ];
  }
  if (course) filter.course = course;
  if (faculty) filter.faculty = faculty;
  if (status) filter.status = status;
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));

  const [items, total] = await Promise.all([
    Student.find(filter)
      .populate('course', 'name')
      .populate('faculty', 'name')
      .populate('grade', 'label')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Student.countDocuments(filter),
  ]);

  sendSuccess(res, 200, 'Students list', {
    items,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

const getStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id).populate('course faculty grade');
  if (!student) throw new ApiError(404, 'Student not found');
  sendSuccess(res, 200, 'Student detail', student);
});

module.exports = { createStudent, approveStudents, listStudents, getStudent };
