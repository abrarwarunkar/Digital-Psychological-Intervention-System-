const ScreeningResult = require('../models/ScreeningResult');
const Escalation = require('../models/Escalation');

// Calculate risk level based on score and type
const calculateRisk = (type, score) => {
    if (type === 'PHQ9') {
        if (score <= 4) return 'none';
        if (score <= 9) return 'mild';
        if (score <= 14) return 'moderate';
        if (score <= 19) return 'moderately severe';
        return 'severe';
    } else if (type === 'GAD7') {
        if (score <= 4) return 'none';
        if (score <= 9) return 'mild';
        if (score <= 14) return 'moderate';
        return 'severe';
    }
    return 'none';
};

// @desc    Submit a new screening result
// @route   POST /api/screening
// @access  Private
const submitScreening = async (req, res) => {
    try {
        const { type, answers } = req.body;

        if (!type || !answers || !Array.isArray(answers)) {
            return res.status(400).json({ message: 'Invalid data' });
        }

        // Calculate total score
        const score = answers.reduce((acc, curr) => acc + curr.answer, 0);
        const riskLevel = calculateRisk(type, score);

        const result = await ScreeningResult.create({
            userId: req.user._id,
            type,
            answers,
            score,
            riskLevel
        });

        // Trigger Escalation if Severe
        if (riskLevel === 'severe' || riskLevel === 'moderately severe') {
            await Escalation.create({
                userId: req.user._id,
                riskLevel: riskLevel === 'severe' ? 'emergency' : 'high',
                reason: `Critical Screening Result: ${type} Score ${score}`,
                status: 'pending',
                notes: [{
                    content: 'Automatic escalation triggered by screening result.',
                    timestamp: new Date()
                }]
            });
        }

        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get user's screening history
// @route   GET /api/screening/user
// @access  Private
const getHistory = async (req, res) => {
    try {
        const results = await ScreeningResult.find({ userId: req.user._id })
            .sort({ createdAt: -1 });
        res.json(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    submitScreening,
    getHistory
};
