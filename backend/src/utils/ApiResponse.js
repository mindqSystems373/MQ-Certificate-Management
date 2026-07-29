function sendSuccess(res, statusCode, message, data = undefined) {
  return res.status(statusCode).json({ success: true, message, data });
}

module.exports = { sendSuccess };
