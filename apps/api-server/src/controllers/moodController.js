const MoodEntry = require('../models/MoodEntry');

// @desc    Log a new mood entry
// @route   POST /api/mood
// @access  Private
const logMood = async (req, res) => {
    try {
        const { mood, note, tags } = req.body;

        if (!mood || mood < 1 || mood > 5) {
            return res.status(400).json({ message: 'Valid mood (1-5) is required' });
        }

        const entry = await MoodEntry.create({
            userId: req.user._id,
            mood,
            note,
            tags
        });

        res.status(201).json(entry);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get mood history
// @route   GET /api/mood/history
// @access  Private
const getMoodHistory = async (req, res) => {
    try {
        // Default to last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const history = await MoodEntry.find({
            userId: req.user._id,
            timestamp: { $gte: thirtyDaysAgo }
        })
            .sort({ timestamp: 1 }); // Sort ascending for charts

        res.json(history);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    logMood,
    getMoodHistory
};
