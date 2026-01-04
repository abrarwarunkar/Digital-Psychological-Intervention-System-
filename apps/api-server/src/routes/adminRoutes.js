const express = require('express');
const router = express.Router();
const { getStats, getFlaggedContent, deleteContent } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.get('/stats', protect, authorize('admin'), getStats);
router.get('/moderation', protect, authorize('admin'), getFlaggedContent);
router.delete('/moderation/:id', protect, authorize('admin'), deleteContent);
router.get('/insights', protect, authorize('admin'), require('../controllers/adminController').getMLInsights);

module.exports = router;
