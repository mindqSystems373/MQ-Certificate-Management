const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/ApiResponse');
const Certificate = require('../models/Certificate');
const { generateCertificatePdf } = require('../services/pdfService');
const defaultTemplate = require('../templates/defaultTemplate');

// Unauthenticated by design — the verification page is the whole point of
// putting a certificate number on the document: anyone holding a certificate
// (or its QR code) can prove it's genuine without an account. Only the fields
// the reference verification page actually shows are returned.
const verify = asyncHandler(async (req, res) => {
  const certificate = await Certificate.findOne({ certificateNumber: req.params.number }).populate('student', 'fullName email');
  if (!certificate) throw new ApiError(404, 'No certificate found for this number');

  sendSuccess(res, 200, 'Certificate verified', {
    certificateNumber: certificate.certificateNumber,
    fullName: certificate.student.fullName,
    email: certificate.student.email,
    issueDate: certificate.issueDate,
  });
});

// Nothing is ever stored for a certificate's PDF (see pdfService.js) — every
// view/download regenerates it fresh from the certificate's own frozen
// snapshot fields, every time. There's deliberately only one template
// (defaultTemplate) regardless of what's recorded in Settings or in the
// certificate's own templateVersion; see defaultTemplate.js.
async function renderCertificatePdf(certificate) {
  const { pdfData } = await generateCertificatePdf({
    certificateNumber: certificate.certificateNumber,
    studentName: certificate.studentNameSnapshot,
    guardianName: certificate.guardianNameSnapshot,
    courseName: certificate.courseNameSnapshot,
    facultyName: certificate.facultyNameSnapshot,
    grade: certificate.gradeLabelSnapshot,
    startDate: certificate.startDate,
    endDate: certificate.endDate,
    issueDate: certificate.issueDate,
    template: defaultTemplate,
    verifyUrl: certificate.qrPayload,
  });
  return pdfData;
}

const view = asyncHandler(async (req, res) => {
  const certificate = await Certificate.findOne({ certificateNumber: req.params.number });
  if (!certificate) throw new ApiError(404, 'Certificate not found');
  const pdfData = await renderCertificatePdf(certificate);

  // helmet() (app.js) sets X-Frame-Options: SAMEORIGIN and a default
  // frame-ancestors 'self' on every response — correct for the rest of the
  // API, but this is the one endpoint meant to be embedded cross-origin (the
  // frontend's verification page iframes it from a different Vercel
  // project). Without loosening just these two headers on just this
  // response, browsers silently refuse to render the iframe.
  res.removeHeader('X-Frame-Options');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://*.vercel.app");
  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `inline; filename="${certificate.certificateNumber}.pdf"`);
  res.send(pdfData);
});

const download = asyncHandler(async (req, res) => {
  const certificate = await Certificate.findOne({ certificateNumber: req.params.number });
  if (!certificate) throw new ApiError(404, 'Certificate not found');
  const pdfData = await renderCertificatePdf(certificate);

  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', `attachment; filename="${certificate.certificateNumber}.pdf"`);
  res.send(pdfData);
});

module.exports = { verify, view, download, renderCertificatePdf };
