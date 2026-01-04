const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    createEscalation,
    getEscalations,
    updateEscalation
} = require('../controllers/escalationController');

// All routes are protected
router.use(protect);

router.post('/', createEscalation);
router.get('/', authorize('counselor', 'admin'), getEscalations);
router.put('/:id', authorize('counselor', 'admin'), updateEscalation);

module.exports = router;
