const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { logMood, getMoodHistory } = require('../controllers/moodController');

router.post('/', protect, logMood);
router.get('/history', protect, getMoodHistory);

module.exports = router;
