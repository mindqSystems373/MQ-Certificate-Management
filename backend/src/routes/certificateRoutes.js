const express = require('express');
const { protect } = require('../middleware/auth');
const { search, getByNumber, downloadByNumber, resend } = require('../controllers/certificateController');

const router = express.Router();

router.get('/search', protect(), search);
router.get('/:number', protect(), getByNumber);
router.get('/:number/download', protect(), downloadByNumber);
router.post('/:number/resend', protect('superadmin', 'management'), resend);

module.exports = router;
