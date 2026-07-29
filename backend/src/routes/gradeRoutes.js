const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/gradeController');

const router = express.Router();

router.get('/', protect(), ctrl.list);
router.post('/', protect('superadmin'), [body('label').notEmpty().withMessage('Grade label is required')], validate, ctrl.create);
router.put('/:id', protect('superadmin'), ctrl.update);
router.delete('/:id', protect('superadmin'), ctrl.deactivate);

module.exports = router;
