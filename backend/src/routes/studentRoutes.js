const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { createStudent, listStudents, getStudent } = require('../controllers/studentController');

const router = express.Router();

const studentValidators = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('guardianName').trim().notEmpty().withMessage('Guardian name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').matches(/^[0-9+\-\s]{7,15}$/).withMessage('Valid phone number is required'),
  body('course').isMongoId().withMessage('Course is required'),
  body('faculty').isMongoId().withMessage('Faculty is required'),
  body('grade').isMongoId().withMessage('Grade is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
];

router.get('/', protect(), listStudents);
router.get('/:id', protect(), getStudent);
router.post('/', protect('superadmin'), studentValidators, validate, createStudent);

module.exports = router;
