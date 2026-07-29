const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    certificateNumber: { type: String, required: true, unique: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
    grade: { type: mongoose.Schema.Types.ObjectId, ref: 'Grade', required: true },

    // Snapshot fields: what the certificate said at the moment it was issued.
    // Kept separate from Student so later edits to a student never rewrite history.
    studentNameSnapshot: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    templateVersion: { type: String, required: true },
    issueDate: { type: Date, required: true, default: Date.now },
    pdfPath: { type: String, required: true },
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
