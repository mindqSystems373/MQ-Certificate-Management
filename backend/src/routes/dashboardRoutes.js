const express = require('express');
const { protect } = require('../middleware/auth');
const { summary, latestCertificates, recentActivity } = require('../controllers/dashboardController');

const router = express.Router();

router.get('/summary', protect(), summary);
router.get('/latest-certificates', protect(), latestCertificates);
router.get('/recent-activity', protect(), recentActivity);

module.exports = router;
