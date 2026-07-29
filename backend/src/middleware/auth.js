const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const Admin = require('../models/Admin');

// Verifies the JWT, then re-checks the account is still active on every request
// (fast DB hit, but it means a disabled admin loses access immediately instead
// of waiting up to JWT_EXPIRES_IN for the token to expire).
const protect = (...roles) =>
  async function protectMiddleware(req, res, next) {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;
      if (!token) throw new ApiError(401, 'Authentication required');

      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const admin = await Admin.findById(payload.sub);
      if (!admin || !admin.isActive) throw new ApiError(401, 'Account not found or disabled');

      if (roles.length && !roles.includes(admin.role)) {
        throw new ApiError(403, 'You do not have permission to perform this action');
      }

      req.admin = admin;
      next();
    } catch (err) {
      next(err);
    }
  };

module.exports = { protect };
