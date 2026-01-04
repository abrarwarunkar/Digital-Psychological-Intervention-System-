const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getRecommendations,
    trackFeedback
} = require('../controllers/recommendationController');

router.use(protect);

router.get('/', getRecommendations);
router.post('/feedback', trackFeedback);

module.exports = router;
