const express = require('express');
const { protect } = require('../middleware/auth');
const { getTemplate, updateTemplate } = require('../controllers/settingsController');

const router = express.Router();

router.get('/template', protect(), getTemplate);
router.put('/template', protect('superadmin'), updateTemplate);

module.exports = router;
