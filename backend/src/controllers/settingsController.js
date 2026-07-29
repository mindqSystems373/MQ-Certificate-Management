const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const Settings = require('../models/Settings');
const ActivityLog = require('../models/ActivityLog');
const defaultTemplate = require('../templates/defaultTemplate');

const getTemplate = asyncHandler(async (req, res) => {
  const setting = await Settings.findOne({ key: 'certificateTemplate' });
  sendSuccess(res, 200, 'Certificate template', setting?.value || defaultTemplate);
});

// Bumping the version string here is what keeps already-issued certificates
// stamped with the OLD template rendering correctly forever — pdfService reads
// whatever is current at generation time and stores that version on the record,
// it never re-renders historical PDFs.
const updateTemplate = asyncHandler(async (req, res) => {
  const current = await Settings.findOne({ key: 'certificateTemplate' });
  const currentVersion = current?.value?.version || defaultTemplate.version;
  const nextVersion = req.body.version || `v${parseInt(currentVersion.replace('v', ''), 10) + 1}`;

  const value = { ...defaultTemplate, ...current?.value, ...req.body, version: nextVersion };

  const setting = await Settings.findOneAndUpdate(
    { key: 'certificateTemplate' },
    { key: 'certificateTemplate', value },
    { new: true, upsert: true }
  );

  await ActivityLog.create({
    type: 'template_updated',
    actor: req.admin._id,
    actorName: req.admin.name,
    description: `${req.admin.name} updated the certificate template to ${nextVersion}`,
  });

  sendSuccess(res, 200, 'Certificate template updated', setting.value);
});

module.exports = { getTemplate, updateTemplate };
