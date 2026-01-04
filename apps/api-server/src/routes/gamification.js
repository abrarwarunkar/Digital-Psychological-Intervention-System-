const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Challenge = require('../models/Challenge');
const { protect } = require('../middleware/auth');

// Get user's gamification progress
router.get('/progress', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select('gamification')
            .populate('gamification.completedChallenges');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user.gamification);
    } catch (error) {
        console.error('Error fetching progress:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get available challenges
router.get('/challenges', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        // Fetch active challenges
        // In a real app, you might filter by date or user level
        const challenges = await Challenge.find({ isActive: true });

        // Map to add 'completed' status
        const challengesWithStatus = challenges.map(challenge => {
            const isCompleted = user.gamification.completedChallenges.includes(challenge._id);
            return {
                ...challenge.toObject(),
                completed: isCompleted
            };
        });

        res.json(challengesWithStatus);
    } catch (error) {
        console.error('Error fetching challenges:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Claim points for a completed challenge
router.post('/claim', protect, async (req, res) => {
    try {
        const { challengeId } = req.body;
        const user = await User.findById(req.user.id);
        const challenge = await Challenge.findById(challengeId);

        if (!challenge) {
            return res.status(404).json({ message: 'Challenge not found' });
        }

        if (user.gamification.completedChallenges.includes(challengeId)) {
            return res.status(400).json({ message: 'Challenge already completed' });
        }

        // Update user stats
        user.gamification.points += challenge.points;
        user.gamification.completedChallenges.push(challengeId);

        // Update streak logic (simplified)
        const today = new Date().setHours(0, 0, 0, 0);
        const lastActivity = user.gamification.lastActivityDate ? new Date(user.gamification.lastActivityDate).setHours(0, 0, 0, 0) : 0;

        if (today > lastActivity) {
            // If last activity was yesterday, increment streak. If older, reset.
            // For now, just incrementing on any new claim for simplicity in demo
            user.gamification.streak += 1;
        }

        user.gamification.lastActivityDate = new Date();

        await user.save();

        res.json({
            message: 'Challenge claimed!',
            pointsAdded: challenge.points,
            newTotal: user.gamification.points,
            streak: user.gamification.streak
        });
    } catch (error) {
        console.error('Error claiming challenge:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
