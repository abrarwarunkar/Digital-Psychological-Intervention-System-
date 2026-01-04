const Resource = require('../models/Resource');
const RecommendationFeedback = require('../models/RecommendationFeedback');
const ScreeningResult = require('../models/ScreeningResult');

// @desc    Get personalized recommendations
// @route   GET /api/recommendations
// @access  Private
const getRecommendations = async (req, res) => {
    try {
        const { limit = 5, context = 'dashboard' } = req.query;
        const userId = req.user._id;

        // 1. Get user's latest screening result to determine needs
        const latestScreening = await ScreeningResult.findOne({ userId })
            .sort({ date: -1 });

        let query = {};
        let reason = "Popular resources for you";

        // Simple rule-based fallback until ML model is fully integrated
        if (latestScreening) {
            if (latestScreening.riskLevel === 'high' || latestScreening.riskLevel === 'severe') {
                query = { category: { $in: ['crisis', 'professional_help'] } };
                reason = "Based on your recent screening (High Priority)";
            } else if (latestScreening.type === 'PHQ-9' && latestScreening.score > 10) {
                query = { tags: { $in: ['depression', 'mood', 'motivation'] } };
                reason = "Helpful for managing low mood";
            } else if (latestScreening.type === 'GAD-7' && latestScreening.score > 10) {
                query = { tags: { $in: ['anxiety', 'stress', 'calm'] } };
                reason = "Strategies for anxiety relief";
            }
        }

        // Fetch resources
        let resources = await Resource.find(query).limit(parseInt(limit));

        // If not enough resources found, fill with popular ones
        if (resources.length < limit) {
            const remaining = limit - resources.length;
            const popular = await Resource.find({ _id: { $nin: resources.map(r => r._id) } })
                .sort({ likes: -1 })
                .limit(remaining);
            resources = [...resources, ...popular];
        }

        // Format response
        const recommendations = resources.map(r => ({
            resourceId: r._id,
            title: r.title,
            category: r.category,
            description: r.description,
            reason: reason,
            score: 0.95 // Placeholder for ML score
        }));

        res.json({
            recommendations,
            context,
            personalizedFor: userId
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Track recommendation feedback
// @route   POST /api/recommendations/feedback
// @access  Private
const trackFeedback = async (req, res) => {
    try {
        const { resourceId, recommendationId, action, rating, timeSpent, context } = req.body;

        await RecommendationFeedback.create({
            userId: req.user._id,
            resourceId,
            recommendationId: recommendationId || 'manual',
            action,
            rating,
            timeSpent,
            context
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getRecommendations,
    trackFeedback
};
