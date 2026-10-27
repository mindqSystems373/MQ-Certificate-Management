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

// Sent the moment a student's details are submitted, before management has
// reviewed anything — sets the expectation that a second mail (the actual
// certificate) follows only after approval, matching the two-step
// submit-then-approve workflow the client asked for.
async function sendAcknowledgmentEmail({ to, studentName }) {
  if (!isConfigured()) {
    return { simulated: true, to };
  }

  const text = `Dear ${studentName},

This mail is to acknowledge that the process for generating Mind Q Course completion certificate has been initiated.

The details submitted by you are being reviewed for approval & after approval you shall receive a separate mail with complete details for downloading electronic certificate & also in independently verifying your certificate authenticity.

Please await the next mail with complete details from us.

Regards,
Mind Q admin team`;

  const html = `<div style="font-family:Georgia,serif;font-size:14px;color:#1f2937;line-height:1.6">
<p>Dear ${escapeHtml(studentName)},</p>
<p>This mail is to acknowledge that the process for generating Mind Q Course completion certificate has been initiated.</p>
<p>The details submitted by you are being reviewed for approval &amp; after approval you shall receive a separate mail with complete details for downloading electronic certificate &amp; also in independently verifying your certificate authenticity.</p>
<p>Please await the next mail with complete details from us.</p>
<p>Regards,<br/><strong>Mind Q admin team</strong></p>
</div>`;

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || 'Mind Q Systems <no-reply@mindq.example>',
    to,
    subject: 'Generate Certificate from Mind Q Systems',
    text,
    html,
  });

  return { simulated: false, to };
}

// Sent once management approves a pending student and the certificate is
// actually generated — carries the download link and the public verification
// link, matching the client's exact reference copy/layout.
async function sendCertificateIssuedEmail({
  to,
  studentName,
  email,
  phone,
  courseName,
  facultyName,
  certificateNumber,
  downloadUrl,
  verifyUrl,
}) {
  if (!isConfigured()) {
    return { simulated: true, to };
  }

  const text = `Dear ${studentName},

Thanks for choosing Mind Q Systems for your training needs.
We truly value your association with us.

Your training completion certificate is generated as per the details provided by you.
Please review the below details & click on the indicated link to download PDF version of your course completion certificate.

Please note that you can provide an online verification reference to prospective employers or others interested in verifying your Mind Q certificate.
The link for verifying your certificate authenticity is given below as well.

If you notice any errors in the certificate please bring it to our attention for correction / modifications at the earliest.

Wishing you all the very best.

Name            : ${studentName}
Email           : ${email}
Contact Number  : ${phone}
Course Name     : ${courseName}
Faculty Name    : ${facultyName}
Certificate Number : ${certificateNumber}
Download Link   : ${downloadUrl}
Verification Link  : ${verifyUrl}`;

  const row = (label, value) =>
    `<tr><td style="padding:4px 16px 4px 0;color:#475569;white-space:nowrap">${label}</td><td style="padding:4px 0">${value}</td></tr>`;

  const html = `<div style="font-family:Georgia,serif;font-size:14px;color:#1f2937;line-height:1.6">
<p>Dear ${escapeHtml(studentName)},</p>
<p>Thanks for choosing Mind Q Systems for your training needs.<br/>We truly value your association with us.</p>
<p>Your training completion certificate is generated as per the details provided by you.<br/>
Please review the below details &amp; click on the indicated link to download PDF version of your course completion certificate.</p>
<p>Please note that you can provide an online verification reference to prospective employers or others interested in verifying your Mind Q certificate.<br/>
The link for verifying your certificate authenticity is given below as well.</p>
<p>If you notice any errors in the certificate please bring it to our attention for correction / modifications at the earliest.</p>
<p>Wishing you all the very best.</p>
<table style="border-top:1px solid #cbd5e1;padding-top:8px;margin-top:8px">
${row('Name', escapeHtml(studentName))}
${row('Email', escapeHtml(email))}
${row('Contact Number', escapeHtml(phone))}
${row('Course Name', escapeHtml(courseName))}
${row('Faculty Name', escapeHtml(facultyName))}
${row('Certificate Number', escapeHtml(certificateNumber))}
${row('Download Link', `<a href="${downloadUrl}">Download</a>`)}
${row('Verification Link', `<a href="${verifyUrl}">${verifyUrl}</a>`)}
</table>
</div>`;

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || 'Mind Q Systems <no-reply@mindq.example>',
    to,
    subject: 'Mind Q Systems Student Course Completion Certificate',
    text,
    html,
  });

  return { simulated: false, to };
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

module.exports = { sendCertificateEmail, sendAcknowledgmentEmail, sendCertificateIssuedEmail, isConfigured };
