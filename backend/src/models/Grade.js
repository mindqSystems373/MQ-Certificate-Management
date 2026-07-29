const mongoose = require('mongoose');

// Kept as its own collection (rather than a hardcoded enum) so Super Admin's
// "Manage Grades" module can add/retire grades without a code change.
const gradeSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, unique: true }, // e.g. "A+", "Distinction"
    minPercentage: { type: Number },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Grade', gradeSchema);
