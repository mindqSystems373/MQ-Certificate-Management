const mongoose = require('mongoose');

// Generic key/value store for things that must stay configurable, not hardcoded:
// the certificate number counter, the certificate template definition, etc.
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
