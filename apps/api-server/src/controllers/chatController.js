const ChatLog = require('../models/ChatLog');
const SessionSummary = require('../models/SessionSummary');
const { getResponse } = require('../services/aiService');
const { analyzeMessage } = require('../services/mlService');

// @desc    Send a message to the AI bot
// @route   POST /api/chat
// @access  Private
const sendMessage = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        // Fetch recent history for context
        const history = await ChatLog.find({ userId: req.user._id })
            .sort({ timestamp: -1 })
            .limit(5)
            .select('message sender');

        // Analyze message with ML service (passing history)
        // Note: history needs to be reversed to be chronological
        const analysis = await analyzeMessage(message, {}, history.reverse());

        // Save user message with analysis
        const userLog = await ChatLog.create({
            userId: req.user._id,
            message,
            sender: 'user',
            riskLevel: analysis.riskLevel,
            intent: analysis.intent,
            confidence: analysis.confidence,
            isEmergency: analysis.emergency
        });

        // Use the response directly from the ML service
        let botResponse = analysis.response || "I'm here to listen.";

        // Save bot message
        const botLog = await ChatLog.create({
            userId: req.user._id,
            message: botResponse,
            sender: 'bot'
        });

        res.json({
            userMessage: userLog,
            botMessage: botLog,
            analysis
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get chat history
// @route   GET /api/chat
// @access  Private
const getHistory = async (req, res) => {
    try {
        const logs = await ChatLog.find({ userId: req.user._id })
            .sort({ timestamp: 1 });
        res.json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Generate session summary
// @route   POST /api/chat/session/:sessionId/summarize
// @access  Private (Counselor/Admin)
const summarizeSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        // In a real app, we would fetch chat logs for this session
        // For now, we'll just use the last 10 messages from the user
        const chats = await ChatLog.find({ userId: req.user._id })
            .sort({ timestamp: -1 })
            .limit(10);

        // Mock ML service call for summary (replace with actual API call later)
        const summaryData = {
            summary: "Student expressed concerns about academic pressure and sleep. Discussed breathing techniques.",
            mainConcerns: ["Academic Stress", "Insomnia"],
            copingStrategies: ["4-7-8 Breathing", "Sleep Hygiene"],
            riskLevel: "low",
            actionItems: ["Practice breathing before bed", "Review study schedule"],
            isAiGenerated: true
        };

        const sessionSummary = await SessionSummary.create({
            userId: req.user._id,
            sessionId, // Using date or ID passed from frontend
            ...summaryData
        });

        res.json(sessionSummary);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    sendMessage,
    getHistory,
    summarizeSession
};
