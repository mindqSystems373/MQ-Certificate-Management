const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    certificateNumber: { type: String, required: true, unique: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
    grade: { type: mongoose.Schema.Types.ObjectId, ref: 'Grade', required: true },

    // Snapshot fields: what the certificate said at the moment it was issued.
    // Kept separate from Student/Course/Faculty/Grade so a later edit to any
    // of those (or even a future rename) never silently rewrites history.
    // Nothing about the PDF itself is stored anywhere (see pdfService.js) —
    // every view/download regenerates it fresh from exactly these fields, so
    // this set is the only thing standing between "frozen as issued" and a
    // certificate drifting whenever something it referenced changes later.
    studentNameSnapshot: { type: String, required: true },
    guardianNameSnapshot: { type: String, required: true },
    courseNameSnapshot: { type: String, required: true },
    facultyNameSnapshot: { type: String, required: true },
    gradeLabelSnapshot: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    templateVersion: { type: String, required: true },
    issueDate: { type: Date, required: true, default: Date.now },
    qrPayload: { type: String },

    status: { type: String, enum: ['issued', 'resent'], default: 'issued' },
    resendHistory: [
      {
        sentAt: { type: Date, default: Date.now },
        sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
        toEmail: { type: String },
        simulated: { type: Boolean, default: true },
      },
    ],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Certificate', certificateSchema);
