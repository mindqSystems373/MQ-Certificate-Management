const asyncHandler = require('./asyncHandler');
const ApiError = require('./ApiError');
const { sendSuccess } = require('./ApiResponse');
const ActivityLog = require('../models/ActivityLog');

/**
 * Courses, Faculties and Grades are all "small reference lists an admin
 * maintains" with the same shape (list active-first, create, update, soft
 * deactivate). Rather than hand-write three near-identical controllers, this
 * factory captures the shared shape once; the differences (schema, which
 * fields are editable, the log type) are passed in per-entity.
 */
function makeCrudController(Model, { entityName, logType, editableFields }) {
  const list = asyncHandler(async (req, res) => {
    const items = await Model.find().sort({ isActive: -1, createdAt: -1 });
    sendSuccess(res, 200, `${entityName} list`, items);
  });

  const create = asyncHandler(async (req, res) => {
    const payload = {};
    editableFields.forEach((f) => {
      if (req.body[f] !== undefined) payload[f] = req.body[f];
    });
    const item = await Model.create(payload);
    await ActivityLog.create({
      type: logType,
      actor: req.admin._id,
      actorName: req.admin.name,
      description: `${req.admin.name} created ${entityName.toLowerCase()} "${item.name || item.label}"`,
    });
    sendSuccess(res, 201, `${entityName} created`, item);
  });

  const update = asyncHandler(async (req, res) => {
    const payload = {};
    editableFields.forEach((f) => {
      if (req.body[f] !== undefined) payload[f] = req.body[f];
    });
    if (req.body.isActive !== undefined) payload.isActive = req.body.isActive;

    const item = await Model.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    if (!item) throw new ApiError(404, `${entityName} not found`);

    await ActivityLog.create({
      type: logType,
      actor: req.admin._id,
      actorName: req.admin.name,
      description: `${req.admin.name} updated ${entityName.toLowerCase()} "${item.name || item.label}"`,
    });
    sendSuccess(res, 200, `${entityName} updated`, item);
  });

  // Deactivate rather than hard-delete: courses/faculties/grades are referenced
  // by historical Student/Certificate records, and deleting the document would
  // break those lookups. isActive:false just hides it from future dropdowns.
  const deactivate = asyncHandler(async (req, res) => {
    const item = await Model.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!item) throw new ApiError(404, `${entityName} not found`);
    sendSuccess(res, 200, `${entityName} deactivated`, item);
  });

  return { list, create, update, deactivate };
}

module.exports = makeCrudController;
