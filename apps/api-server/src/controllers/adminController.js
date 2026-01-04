const User = require('../models/User');
const ScreeningResult = require('../models/ScreeningResult');
const ForumPost = require('../models/ForumPost');
const axios = require('axios');

// @desc    Get system stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = async (req, res) => {
    try {
        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalCounsellors = await User.countDocuments({ role: 'counsellor' });
        const totalScreenings = await ScreeningResult.countDocuments();
        const totalPosts = await ForumPost.countDocuments();

        // Calculate risk distribution
        const riskDistribution = await ScreeningResult.aggregate([
            { $group: { _id: '$riskLevel', count: { $sum: 1 } } }
        ]);

        res.json({
            totalStudents,
            totalCounsellors,
            totalScreenings,
            totalPosts,
            riskDistribution
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get flagged content
// @route   GET /api/admin/moderation
// @access  Private/Admin
const getFlaggedContent = async (req, res) => {
    try {
        const flaggedPosts = await ForumPost.find({ flags: { $gt: 0 } })
            .populate('userId', 'name email')
            .sort({ flags: -1 });

        res.json(flaggedPosts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete content
// @route   DELETE /api/admin/moderation/:id
// @access  Private/Admin
const deleteContent = async (req, res) => {
    try {
        await ForumPost.findByIdAndDelete(req.params.id);
        res.json({ message: 'Content deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const RecommendationFeedback = require('../models/RecommendationFeedback');

// @desc    Get ML Insights
// @route   GET /api/admin/insights
// @access  Private/Admin
const getMLInsights = async (req, res) => {
    try {
        // 1. Risk Trends (Real Aggregation - Last 30 Days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const riskTrendsRaw = await ScreeningResult.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        riskLevel: "$riskLevel"
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.date": 1 } }
        ]);

        // Process raw data into frontend-friendly format
        const riskTrendsMap = {};
        riskTrendsRaw.forEach(item => {
            const date = item._id.date;
            const risk = item._id.riskLevel;
            const count = item.count;

            if (!riskTrendsMap[date]) {
                riskTrendsMap[date] = { date, highRisk: 0, mediumRisk: 0, lowRisk: 0 };
            }

            if (risk === 'severe' || risk === 'moderately severe') {
                riskTrendsMap[date].highRisk += count;
            } else if (risk === 'moderate') {
                riskTrendsMap[date].mediumRisk += count;
            } else {
                riskTrendsMap[date].lowRisk += count;
            }
        });
        const riskTrends = Object.values(riskTrendsMap).sort((a, b) => a.date.localeCompare(b.date));

        // 2. Resource Effectiveness (Existing Real Aggregation)
        const topResources = await RecommendationFeedback.aggregate([
            { $match: { action: 'click' } },
            { $group: { _id: '$resourceId', count: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'resources', localField: '_id', foreignField: '_id', as: 'resource' } },
            { $unwind: '$resource' },
            { $project: { title: '$resource.title', count: 1, avgRating: 1 } }
        ]);

        // 3. Keyword Analysis (Real NLP via Python Service)
        const recentPosts = await ForumPost.find({ createdAt: { $gte: thirtyDaysAgo } }).select('content title');
        const texts = recentPosts.map(p => `${p.title} ${p.content}`);

        let keywords = [];
        try {
            // Call Python ML Service
            const mlResponse = await axios.post('http://localhost:8000/analyze/keywords', { texts });
            keywords = mlResponse.data.keywords;
        } catch (mlError) {
            console.error('ML Service Error:', mlError.message);
            // Fallback: Return empty or handle gracefully
            keywords = [];
        }

        res.json({
            riskTrends,
            topResources,
            keywords
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getStats,
    getFlaggedContent,
    deleteContent,
    getMLInsights
};
