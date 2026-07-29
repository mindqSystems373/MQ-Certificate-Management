const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { login, me, logout } = require('../controllers/authController');

const router = express.Router();

router.post(
  '/login',
  [body('email').isEmail().withMessage('Valid email is required'), body('password').notEmpty().withMessage('Password is required')],
  validate,
  login
);
router.get('/me', protect(), me);
router.post('/logout', protect(), logout);

module.exports = router;
