const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true }, // e.g. STU000001
    fullName: { type: String, required: true, trim: true },
    guardianName: { type: String, required: true, trim: true },
    // No longer globally unique — the same person can legitimately take more
    // than one course. What must stay unique is one submission per course:
    // see the compound indexes below.
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
    grade: { type: mongoose.Schema.Types.ObjectId, ref: 'Grade', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    // Denormalized certificate pointers for fast lookup from the Student record
    // (the Certificate collection remains the source of truth for issuance history).
    certificateNumber: { type: String, unique: true, sparse: true },
    certificateTemplateVersion: { type: String },
    certificatePDF: { type: Boolean, default: false }, // true once a Certificate exists; the PDF itself is never stored anywhere — see pdfService.js

    status: { type: String, enum: ['pending', 'issued'], default: 'pending' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  },
  { timestamps: true }
);

studentSchema.index({ fullName: 'text', email: 'text' });
// Same student can enroll in multiple courses (separate documents), but not
// submit twice for the *same* course — either field matching an existing
// submission for that course is enough to count as a duplicate.
studentSchema.index({ email: 1, course: 1 }, { unique: true });
studentSchema.index({ phone: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Student', studentSchema);
