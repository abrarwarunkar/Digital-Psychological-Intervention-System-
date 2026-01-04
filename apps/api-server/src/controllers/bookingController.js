const Booking = require('../models/Booking');
const Availability = require('../models/Availability');
const User = require('../models/User');

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = async (req, res) => {
    try {
        const { counsellorId, date, timeSlot, notes } = req.body;

        // Basic validation
        if (!counsellorId || !date || !timeSlot) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Check if slot is already booked
        const existingBooking = await Booking.findOne({
            counsellorId,
            date: new Date(date),
            timeSlot,
            status: { $ne: 'cancelled' }
        });

        if (existingBooking) {
            return res.status(400).json({ message: 'This slot is already booked' });
        }

        const booking = await Booking.create({
            studentId: req.user._id,
            counsellorId,
            date: new Date(date),
            timeSlot,
            notes
        });

        res.status(201).json(booking);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get bookings for current user
// @route   GET /api/bookings
// @access  Private
const getMyBookings = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'student') {
            query.studentId = req.user._id;
        } else if (req.user.role === 'counsellor') {
            query.counsellorId = req.user._id;
        }

        const bookings = await Booking.find(query)
            .populate('studentId', 'name email')
            .populate('counsellorId', 'name email')
            .sort({ date: 1, timeSlot: 1 });

        res.json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Set availability (Counsellor only)
// @route   POST /api/bookings/availability
// @access  Private (Counsellor)
const setAvailability = async (req, res) => {
    try {
        const { dayOfWeek, startTime, endTime } = req.body;

        if (req.user.role !== 'counsellor') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const availability = await Availability.create({
            counsellorId: req.user._id,
            dayOfWeek,
            startTime,
            endTime
        });

        res.status(201).json(availability);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get availability for a counsellor
// @route   GET /api/bookings/availability/:counsellorId
// @access  Private
const getAvailability = async (req, res) => {
    try {
        const availability = await Availability.find({ counsellorId: req.params.counsellorId });
        res.json(availability);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all counsellors
// @route   GET /api/bookings/counsellors
// @access  Private
const getCounsellors = async (req, res) => {
    try {
        const counsellors = await User.find({ role: 'counsellor' }).select('name email profile');
        res.json(counsellors);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createBooking,
    getMyBookings,
    setAvailability,
    getAvailability,
    getCounsellors
};
