const express = require('express');
const router = express.Router();
const {
    createBooking,
    getMyBookings,
    setAvailability,
    getAvailability,
    getCounsellors
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, createBooking);
router.get('/', protect, getMyBookings);
router.get('/counsellors', protect, getCounsellors);
router.post('/availability', protect, authorize('counsellor'), setAvailability);
router.get('/availability/:counsellorId', protect, getAvailability);

module.exports = router;
