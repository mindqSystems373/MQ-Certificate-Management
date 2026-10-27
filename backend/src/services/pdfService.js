const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

// Same fallback used by emailService/publicController for building links that
// point back at the deployed frontend — set FRONTEND_URL in the backend's env
// once the frontend's production URL is known; this default matches the
// project's actual current deployment so local/dev runs still produce a
// working link without extra setup.
const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://mindq-certificate-frontend.vercel.app').replace(/\/$/, '');

function buildVerifyUrl(certificateNumber) {
  return `${FRONTEND_URL}/verification?number=${encodeURIComponent(certificateNumber)}`;
}

// Generated fully in memory and returned as a Buffer, on every view/download
// request — nothing is ever persisted to disk, Mongo, or object storage (see
// publicController.js / certificateController.js). The only thing that has
// to stay stable across repeated calls for the same certificate is the data
// passed in here (the Certificate document's own frozen snapshot fields), so
// a certificate always reproduces identically no matter when it's re-rendered.
const TEMPLATES_DIR = path.join(__dirname, '..', 'assets', 'templates');

// The one template in use: the client's original certificate artwork
// (mq_certificate_legacy.jpg, 678x900px — the same image their legacy PHP
// site used). Only one template exists by design (no version-switching), so
// every certificate — migrated-historical or newly issued — renders onto
// this same artwork. Coordinates below are in the ORIGINAL IMAGE'S pixel
// space and converted with the one scale factor below; measured by hand off
// the actual image with a pixel ruler overlay.
const IMAGE_WIDTH = 678;
const IMAGE_HEIGHT = 900;

// Everything below was cross-checked against a real certificate the legacy
// PHP system actually printed (a user-supplied reference PDF), not just the
// blank template — that's what pinned down the font (bold sans-serif, not a
// script/serif face), the color (pure black), and that dates are printed
// exactly as stored rather than reformatted. Font is pdfkit's built-in
// Helvetica-Bold — no font file to bundle, and it's a close visual match to
// whatever the legacy system's browser-default bold sans-serif rendered as.
// The legacy PHP template had a length check on the name specifically
// (strlen($row['NAME']) > 25): short names stay on the same line as the
// "Mr./Ms./Mrs" label, long ones drop to the blank continuation line below
// it instead of truncating. Reproduced here with the same 25-char threshold
// and the same two target positions, rather than ellipsis-truncating names
// the original system never would have cut off.
const STUDENT_NAME_LENGTH_THRESHOLD = 25;
const STUDENT_NAME_SHORT = { text: [410, 400], width: 205, size: 13 };
const STUDENT_NAME_LONG = { text: [70, 452], width: 545, size: 13 };

const FIELDS = {
  certificateNumber: { text: [145, 348], width: 450, size: 14 },
  guardianName: { text: [200, 488], width: 415, size: 12 },
  courseName: { text: [310, 538], width: 305, size: 12 },
  startDate: { text: [205, 589], width: 135, size: 12 },
  endDate: { text: [400, 589], width: 210, size: 12 },
  performance: { text: [490, 623], width: 125, size: 12 },
  issueDate: { text: [106, 758], width: 170, size: 12 },
  // Deliberately no `grade` entry: the reference printout leaves the
  // "Grade." line blank — the legacy system only ever filled in the
  // "performance" line above it, never this one, so this reproduces that
  // exactly rather than "completing" something the original never did.
};

// Blank space measured directly off the artwork (top-left, below the
// decorative border and well clear of the logo, which starts around
// x=460) — the only genuinely open area on this small, busy layout. This is
// the one addition beyond what the legacy system printed (QR + verify link),
// added at the client's explicit request.
const QR_BOX = { x: 52, y: 48, size: 58 };
const CAPTION_BOX = { x: 40, y: 110, width: 82 };

const INK_COLOR = '#000000'; // sampled from a real printed certificate — pure black, not the artwork's brownish label ink

function scale(v) {
  return (v * 595.28) / IMAGE_WIDTH;
}
function scaleY(v) {
  return (v * 841.89) / IMAGE_HEIGHT;
}

// The legacy system never reformatted dates — it printed exactly what was
// stored (DD-MM-YYYY for course start/end, YYYY-MM-DD for the auto-generated
// issue date), confirmed against the reference printout. Using UTC getters
// rather than toLocaleDateString avoids a server-timezone-dependent
// off-by-one day shift on date-only values.
function formatDMY(d) {
  const dt = new Date(d);
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${dt.getUTCFullYear()}`;
}
function formatYMD(d) {
  const dt = new Date(d);
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  return `${dt.getUTCFullYear()}-${mm}-${dd}`;
}

function drawAt(doc, f, value) {
  if (!f || value == null) return;
  // Long values (course/guardian names) would otherwise wrap to a second
  // line and spill off this already-tight layout — force a single line with
  // an ellipsis instead. studentName is the one exception: see STUDENT_NAME_*
  // above and its dedicated call in generateCertificatePdf.
  doc
    .font('Helvetica-Bold')
    .fontSize(f.size)
    .fillColor(INK_COLOR)
    .text(String(value), scale(f.text[0]), scaleY(f.text[1]), {
      width: scale(f.width),
      height: f.size * 1.3,
      ellipsis: true,
      lineBreak: false,
    });
}

function drawField(doc, key, value) {
  drawAt(doc, FIELDS[key], value);
}

/**
 * Renders one certificate onto the client's original certificate artwork.
 * Called fresh on every view/download — see the top-of-file note on why
 * nothing from this function's output is ever stored anywhere.
 */
async function generateCertificatePdf({
  certificateNumber,
  studentName,
  guardianName,
  courseName,
  facultyName, // not shown on this template; kept for API/DB consistency
  grade,
  startDate,
  endDate,
  issueDate,
  template,
}) {
  const verifyUrl = buildVerifyUrl(certificateNumber);

  // Generated before the PDF stream starts — pdfkit's doc.image() needs the
  // data URI ready synchronously when it's drawn, and QRCode.toDataURL is
  // async, so this can't happen inside the same tick as the rest of the draw
  // calls below.
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    margin: 1,
    width: 200,
    color: { dark: INK_COLOR, light: '#00000000' },
  });

  const doc = new PDFDocument({ size: 'A4', margin: 0 });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  const templateImagePath = path.join(TEMPLATES_DIR, template.templateImage);
  doc.image(templateImagePath, 0, 0, { width: doc.page.width, height: doc.page.height });

  drawField(doc, 'certificateNumber', certificateNumber);
  const nameField = String(studentName || '').trim().length > STUDENT_NAME_LENGTH_THRESHOLD ? STUDENT_NAME_LONG : STUDENT_NAME_SHORT;
  drawAt(doc, nameField, studentName);
  drawField(doc, 'guardianName', guardianName);
  drawField(doc, 'courseName', courseName);
  drawField(doc, 'startDate', formatDMY(startDate));
  drawField(doc, 'endDate', formatDMY(endDate));
  drawField(doc, 'performance', grade);
  drawField(doc, 'issueDate', formatYMD(issueDate));

  doc.image(qrDataUrl, scale(QR_BOX.x), scaleY(QR_BOX.y), { width: scale(QR_BOX.size), height: scaleY(QR_BOX.size) });

  const captionWidth = scale(CAPTION_BOX.width);
  const captionX = scale(CAPTION_BOX.x);
  doc.font('Helvetica').fontSize(6.5).fillColor(INK_COLOR);
  doc.text('Scan to verify', captionX, scaleY(CAPTION_BOX.y), { width: captionWidth, align: 'center' });

  const pdfData = await new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });

  return { pdfData, qrPayload: verifyUrl };
}

module.exports = { generateCertificatePdf };
