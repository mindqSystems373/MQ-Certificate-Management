const ApiError = require('../utils/ApiError');

function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// Centralized error translator: every controller throws/forwards ApiError or a
// Mongoose error, and this is the only place that turns it into an HTTP response.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details;

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.code === 11000) {
    statusCode = 409;
    const keys = Object.keys(err.keyValue || {});
    const field = keys[0] || 'field';
    if (keys.includes('course')) {
      // Student's {email,course} / {phone,course} compound indexes — a plain
      // "already exists" reads as "this student can never enroll again",
      // which is wrong now that the same person can take multiple courses.
      message = `A student with this ${field} is already registered for this course`;
    } else {
      message = `Duplicate value for ${field}: "${err.keyValue?.[field]}" already exists`;
    }
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for ${err.path}: ${err.value}`;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Session expired, please log in again';
  }

  if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
}

module.exports = { notFound, errorHandler };
