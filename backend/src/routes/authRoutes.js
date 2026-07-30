const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { login, me, logout } = require('../controllers/authController');

const router = express.Router();

router.post(
  '/login',
  // Admin login is an internal identifier (e.g. "admin@mindq"), not necessarily
  // a deliverable email address — so this only checks it's present, not RFC-valid.
  // The student "Email Address" field in studentRoutes.js keeps strict isEmail()
  // since resend/notification actually needs to reach that address.
  [body('email').trim().notEmpty().withMessage('Login ID is required'), body('password').notEmpty().withMessage('Password is required')],
  validate,
  login
);
router.get('/me', protect(), me);
router.post('/logout', protect(), logout);

module.exports = router;
