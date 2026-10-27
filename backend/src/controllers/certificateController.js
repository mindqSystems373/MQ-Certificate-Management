const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/ApiResponse');
const Certificate = require('../models/Certificate');
const ActivityLog = require('../models/ActivityLog');
const { sendCertificateEmail } = require('../services/emailService');
const { renderCertificatePdf } = require('./publicController');

const populateOpts = ['student', 'course', 'faculty', 'grade'];

const search = asyncHandler(async (req, res) => {
  const { q, course, faculty, status, dateFrom, dateTo, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (q) {
    filter.$or = [
      { certificateNumber: { $regex: q, $options: 'i' } },
      { studentNameSnapshot: { $regex: q, $options: 'i' } },
    ];
  }
  if (course) filter.course = course;
  if (faculty) filter.faculty = faculty;
  if (status) filter.status = status;
  if (dateFrom || dateTo) {
    filter.issueDate = {};
    if (dateFrom) filter.issueDate.$gte = new Date(dateFrom);
    if (dateTo) filter.issueDate.$lte = new Date(dateTo);
  }

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));

  const [items, total] = await Promise.all([
    Certificate.find(filter)
      .populate('student', 'fullName email phone')
      .populate('course', 'name')
      .populate('faculty', 'name')
      .populate('grade', 'label')
      .sort({ issueDate: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Certificate.countDocuments(filter),
  ]);

  if (q) {
    await ActivityLog.create({
      type: 'certificate_searched',
      actor: req.admin._id,
      actorName: req.admin.name,
      description: `${req.admin.name} searched certificates for "${q}"`,
    });
  }

  sendSuccess(res, 200, 'Certificate search results', {
    items,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  });
});

const getByNumber = asyncHandler(async (req, res) => {
  const certificate = await Certificate.findOne({ certificateNumber: req.params.number }).populate(populateOpts);
  if (!certificate) throw new ApiError(404, 'Certificate not found');
  sendSuccess(res, 200, 'Certificate detail', certificate);
});

const downloadByNumber = asyncHandler(async (req, res) => {
  const certificate = await Certificate.findOne({ certificateNumber: req.params.number });
  if (!certificate) throw new ApiError(404, 'Certificate not found');
  const pdfData = await renderCertificatePdf(certificate);

  await ActivityLog.create({
    type: 'certificate_downloaded',
    actor: req.admin._id,
    actorName: req.admin.name,
    description: `${req.admin.name} downloaded certificate ${certificate.certificateNumber}`,
  });

  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `attachment; filename="${certificate.certificateNumber}.pdf"`);
  res.send(pdfData);
});

const resend = asyncHandler(async (req, res) => {
  const certificate = await Certificate.findOne({ certificateNumber: req.params.number }).populate('student', 'fullName email');
  if (!certificate) throw new ApiError(404, 'Certificate not found');
  const pdfData = await renderCertificatePdf(certificate);

  const result = await sendCertificateEmail({
    to: certificate.student.email,
    studentName: certificate.student.fullName,
    certificateNumber: certificate.certificateNumber,
    pdfBuffer: pdfData,
  });

  certificate.status = 'resent';
  certificate.resendHistory.push({
    sentBy: req.admin._id,
    toEmail: certificate.student.email,
    simulated: result.simulated,
  });
  await certificate.save();

  await ActivityLog.create({
    type: 'certificate_resent',
    actor: req.admin._id,
    actorName: req.admin.name,
    description: `${req.admin.name} ${result.simulated ? 'simulated resend of' : 'resent'} certificate ${certificate.certificateNumber} to ${certificate.student.email}`,
  });

  sendSuccess(res, 200, result.simulated ? 'Resend simulated (SMTP not configured)' : 'Certificate emailed successfully', {
    simulated: result.simulated,
    to: result.to,
  });
});

module.exports = { search, getByNumber, downloadByNumber, resend };
