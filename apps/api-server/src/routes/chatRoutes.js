const express = require('express');
const router = express.Router();
const { sendMessage, getHistory } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.post('/', protect, sendMessage);
router.get('/', protect, getHistory);
router.post('/session/:sessionId/summarize', protect, require('../controllers/chatController').summarizeSession);

module.exports = router;
