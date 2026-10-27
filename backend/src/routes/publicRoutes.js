const express = require('express');
const { verify, view, download } = require('../controllers/publicController');

const router = express.Router();

router.get('/certificates/:number/verify', verify);
router.get('/certificates/:number/view', view);
router.get('/certificates/:number/download', download);

module.exports = router;
