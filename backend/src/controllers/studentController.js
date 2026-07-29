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
const { generateCertificatePdf } = require('../services/pdfService');
const defaultTemplate = require('../templates/defaultTemplate');

async function nextStudentId() {
  const counter = await Settings.findOneAndUpdate(
    { key: 'studentCounter' },
    { $inc: { 'value.sequence': 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return `STU${String(counter.value.sequence).padStart(6, '0')}`;
}

/**
 * PRD flow: Submit -> Save MongoDB -> Generate Certificate Number -> Generate PDF
 * -> Save PDF -> Dashboard Updated. "Enter Student Data" and "New Certificate
 * Generation" are the same screen/action in this demo (a student is only ever
 * created together with their certificate), matching the Student schema in the
 * PRD which stores certificateNumber/certificatePDF directly on the record.
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

  // Step 1: Save MongoDB (student record, not yet certified)
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

  // Step 2: Generate certificate number (atomic, never duplicates)
  const certificateNumber = await getNextCertificateNumber();

  // Step 3 + 4: Generate PDF from the current template and persist it to disk
  const templateSetting = await Settings.findOne({ key: 'certificateTemplate' });
  const template = templateSetting?.value || defaultTemplate;

  const { relativePath, qrPayload } = await generateCertificatePdf({
    certificateNumber,
    studentName: fullName,
    guardianName,
    courseName: courseDoc.name,
    facultyName: facultyDoc.name,
    grade: gradeDoc.label,
    startDate,
    endDate,
    issueDate: new Date(),
    template,
  });

  // Step 5: Record the certificate + update the student -> dashboard reflects it
  const certificate = await Certificate.create({
    certificateNumber,
    student: student._id,
    course: courseDoc._id,
    faculty: facultyDoc._id,
    grade: gradeDoc._id,
    studentNameSnapshot: fullName,
    guardianNameSnapshot: guardianName,
    startDate,
    endDate,
    templateVersion: template.version,
    issueDate: new Date(),
    pdfPath: relativePath,
    qrPayload,
    createdBy: req.admin._id,
  });

  student.certificateNumber = certificateNumber;
  student.certificateTemplateVersion = template.version;
  student.certificatePDF = relativePath;
  student.status = 'issued';
  await student.save();

  await ActivityLog.create({
    type: 'certificate_generated',
    actor: req.admin._id,
    actorName: req.admin.name,
    description: `${req.admin.name} generated certificate ${certificateNumber} for ${fullName}`,
    meta: { certificateNumber, studentId: student._id },
  });

  sendSuccess(res, 201, 'Student created and certificate generated', {
    student,
    certificate,
    downloadUrl: `/api/certificates/${certificateNumber}/download`,
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

module.exports = { createStudent, listStudents, getStudent };
