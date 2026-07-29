const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true }, // e.g. STU000001
    fullName: { type: String, required: true, trim: true },
    guardianName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
    grade: { type: mongoose.Schema.Types.ObjectId, ref: 'Grade', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    // Denormalized certificate pointers for fast lookup from the Student record
    // (the Certificate collection remains the source of truth for issuance history).
    certificateNumber: { type: String, unique: true, sparse: true },
    certificateTemplateVersion: { type: String },
    certificatePDF: { type: String }, // relative path under /storage/certificates

    status: { type: String, enum: ['pending', 'issued'], default: 'pending' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  },
  { timestamps: true }
);

studentSchema.index({ fullName: 'text', email: 'text' });

module.exports = mongoose.model('Student', studentSchema);
