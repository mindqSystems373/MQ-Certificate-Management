const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        'login',
        'login_failed',
        'logout',
        'student_created',
        'student_submitted',
        'certificate_generated',
        'certificate_approved',
        'certificate_searched',
        'certificate_downloaded',
        'certificate_resent',
        'course_saved',
        'faculty_saved',
        'grade_saved',
        'template_updated',
      ],
    },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    actorName: { type: String },
    description: { type: String, required: true },
    meta: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String },
  },
  { timestamps: true }
);

activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
