const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const STORAGE_DIR = path.join(__dirname, '..', '..', 'storage', 'certificates');
const TEMPLATES_DIR = path.join(__dirname, '..', 'assets', 'templates');
const FONTS_DIR = path.join(__dirname, '..', 'assets', 'fonts');
const SERIF_FONT = path.join(FONTS_DIR, 'EBGaramond-Regular.ttf');

// The source artwork is 1055x1491px (see docs/certificate-template-source.svg).
// The PDF page is rendered at standard A4 portrait, so every coordinate below
// is expressed in the ORIGINAL IMAGE'S pixel space and converted with this one
// scale factor — keeps the coordinate table readable against the image
// (open mindq-certificate-template.jpg at full size to cross-check any of
// these numbers) instead of pre-converted, unreadable PDF points.
const IMAGE_WIDTH = 1055;
const IMAGE_HEIGHT = 1491;
const PATCH_COLOR = '#F9E9A2'; // sampled from the artwork's blank parchment areas

// Where each {{PLACEHOLDER}} token sits on the artwork. `patch` blanks out a
// generous strip (parchment-colored) from just past the printed label to near
// the card border to erase the literal "{{...}}" text, then the real value is
// drawn starting at the same left edge. Coordinates were measured directly off
// the source image: for every row, the dotted guideline's y was found by
// scanning for the densest horizontal band of dark pixels, then each label's
// right edge was found by scanning for dark-pixel column runs — see the
// measurement script notes in docs/DEPLOYMENT.md if this ever needs redoing
// for a revised template image. `patch` deliberately extends well past the
// original placeholder's width (robust to text of any length) up to the next
// label or the card's inner border, whichever comes first.
const FIELDS = {
  certificateNumber: { patch: [189, 532, 766, 40], text: [199, 538], width: 730, size: 13 },
  studentName: { patch: [539, 622, 416, 40], text: [549, 628], width: 390, size: 13 },
  guardianName: { patch: [316, 714, 639, 40], text: [326, 720], width: 610, size: 12 },
  courseName: { patch: [361, 805, 594, 40], text: [371, 811], width: 565, size: 12 },
  startDate: { patch: [262, 894, 312, 40], text: [272, 900], width: 290, size: 12 },
  endDate: { patch: [615, 894, 340, 40], text: [625, 900], width: 320, size: 12 },
  performance: { patch: [531, 973, 424, 40], text: [541, 979], width: 400, size: 12 },
  grade: { patch: [185, 1054, 770, 36], text: [195, 1059], width: 740, size: 12 },
  issueDate: { patch: [167, 1162, 293, 40], text: [177, 1168], width: 270, size: 12 },
  authCode: { patch: [378, 1367, 197, 36], text: [388, 1373], width: 180, size: 8.5 },
  verifyUrl: { patch: [665, 1367, 195, 36], text: [675, 1373], width: 180, size: 6.5 },
};

const QR_BOX = { x: 875, y: 1348, width: 104, height: 116 }; // white QR margin naturally covers the "{{QR_CODE}}" caption below it

function scale(v) {
  return (v * 595.28) / IMAGE_WIDTH;
}
function scaleY(v) {
  return (v * 841.89) / IMAGE_HEIGHT;
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function drawField(doc, key, value) {
  const f = FIELDS[key];
  if (!f || value == null) return;
  const [px, py, pw, ph] = f.patch;
  doc.rect(scale(px), scaleY(py), scale(pw), scaleY(ph)).fill(PATCH_COLOR);
  doc
    .font('Serif')
    .fontSize(f.size)
    .fillColor('#1a1006')
    .text(String(value), scale(f.text[0]), scaleY(f.text[1]), { width: scale(f.width) });
}

/**
 * Renders one certificate onto the client's actual template artwork.
 * Company branding, seal, signature and footer copy are all part of that
 * image already — this only fills in the per-student fields at their
 * measured positions and drops in the verification QR code.
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
  if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });

  const fileName = `${certificateNumber}.pdf`;
  const filePath = path.join(STORAGE_DIR, fileName);
  const relativePath = path.posix.join('certificates', fileName);

  const verifyUrl = template.verifyUrl;
  const qrPayload = JSON.stringify({ certificateNumber, studentName, courseName, verify: verifyUrl });
  const qrDataUrl = await QRCode.toDataURL(qrPayload, { margin: 1, width: 300 });
  const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

  const doc = new PDFDocument({ size: 'A4', margin: 0 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.registerFont('Serif', SERIF_FONT);

  const templateImagePath = path.join(TEMPLATES_DIR, template.templateImage);
  doc.image(templateImagePath, 0, 0, { width: doc.page.width, height: doc.page.height });

  drawField(doc, 'certificateNumber', certificateNumber);
  drawField(doc, 'studentName', studentName);
  drawField(doc, 'guardianName', guardianName);
  drawField(doc, 'courseName', courseName);
  drawField(doc, 'startDate', formatDate(startDate));
  drawField(doc, 'endDate', formatDate(endDate));
  drawField(doc, 'performance', grade);
  drawField(doc, 'grade', grade);
  drawField(doc, 'issueDate', formatDate(issueDate));
  drawField(doc, 'authCode', certificateNumber);
  drawField(doc, 'verifyUrl', verifyUrl);

  doc.image(qrBuffer, scale(QR_BOX.x), scaleY(QR_BOX.y), { width: scale(QR_BOX.width), height: scaleY(QR_BOX.height) });

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  return { relativePath, absolutePath: filePath, qrPayload };
}

function getAbsolutePath(relativePath) {
  return path.join(__dirname, '..', '..', 'storage', relativePath);
}

module.exports = { generateCertificatePdf, getAbsolutePath, STORAGE_DIR };
