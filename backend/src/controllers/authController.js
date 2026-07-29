const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/ApiResponse');
const Admin = require('../models/Admin');
const ActivityLog = require('../models/ActivityLog');

function signToken(admin, rememberMe) {
  const expiresIn = rememberMe
    ? process.env.JWT_REMEMBER_EXPIRES_IN || '30d'
    : process.env.JWT_EXPIRES_IN || '8h';
  return jwt.sign({ sub: admin._id.toString(), role: admin.role }, process.env.JWT_SECRET, { expiresIn });
}

function toSafeAdmin(admin) {
  return { id: admin._id, name: admin.name, email: admin.email, role: admin.role };
}

const login = asyncHandler(async (req, res) => {
  const { email, password, rememberMe } = req.body;

  const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');
  if (!admin || !admin.isActive) {
    await ActivityLog.create({ type: 'login_failed', description: `Failed login for ${email}` });
    throw new ApiError(401, 'Invalid email or password');
  }

  const isMatch = await admin.comparePassword(password);
  if (!isMatch) {
    await ActivityLog.create({ type: 'login_failed', actor: admin._id, actorName: admin.name, description: `Failed login for ${email}` });
    throw new ApiError(401, 'Invalid email or password');
  }

  admin.lastLoginAt = new Date();
  await admin.save();

  const token = signToken(admin, Boolean(rememberMe));
  await ActivityLog.create({ type: 'login', actor: admin._id, actorName: admin.name, description: `${admin.name} logged in` });

  sendSuccess(res, 200, 'Login successful', { token, admin: toSafeAdmin(admin) });
});

const me = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, 'Current session', { admin: toSafeAdmin(req.admin) });
});

const logout = asyncHandler(async (req, res) => {
  // JWTs here are stateless (no server-side session store), so "logout" is a
  // client-side token discard. We still log it for the Activity Logs module.
  await ActivityLog.create({ type: 'logout', actor: req.admin._id, actorName: req.admin.name, description: `${req.admin.name} logged out` });
  sendSuccess(res, 200, 'Logged out');
});

module.exports = { login, me, logout };
