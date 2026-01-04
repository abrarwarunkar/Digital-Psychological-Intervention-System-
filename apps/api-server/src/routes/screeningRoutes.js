const express = require('express');
const router = express.Router();
const { submitScreening, getHistory } = require('../controllers/screeningController');
const { protect } = require('../middleware/auth');

router.post('/', protect, submitScreening);
router.get('/user', protect, getHistory);

module.exports = router;
