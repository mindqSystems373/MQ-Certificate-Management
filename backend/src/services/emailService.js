const nodemailer = require('nodemailer');

let transporter = null;
function isConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

/**
 * Sends (or simulates sending) a certificate to a student's email.
 *
 * PRD explicitly allows either behavior for the demo. We branch on whether SMTP
 * env vars are present rather than a hardcoded flag, so the exact same code path
 * runs in "simulate" mode on a laptop with no mail server and in "real" mode once
 * ops drops SMTP credentials into .env for the client demo — no code change
 * needed to flip that switch.
 */
async function sendCertificateEmail({ to, studentName, certificateNumber, pdfBuffer }) {
  if (!isConfigured()) {
    return { simulated: true, to };
  }

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || 'Mind Q Systems <no-reply@mindq.example>',
    to,
    subject: `Your Mind Q Systems Certificate (${certificateNumber})`,
    text: `Dear ${studentName},\n\nPlease find attached your certificate (${certificateNumber}).\n\nRegards,\nMind Q Systems`,
    attachments: [{ filename: `${certificateNumber}.pdf`, content: pdfBuffer }],
  });

  return { simulated: false, to };
}

module.exports = { sendCertificateEmail, isConfigured };
