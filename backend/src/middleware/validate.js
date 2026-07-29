const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Runs after an express-validator chain; turns field errors into one 400 ApiError
// with a `details` array the frontend can map straight onto form fields.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const details = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  next(new ApiError(400, 'Validation failed', details));
}

module.exports = validate;
