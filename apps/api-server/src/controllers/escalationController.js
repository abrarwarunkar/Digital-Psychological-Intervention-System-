const Escalation = require('../models/Escalation');
const User = require('../models/User');

// @desc    Create a new escalation
// @route   POST /api/escalation
// @access  Private (System/Bot)
const createEscalation = async (req, res) => {
    try {
        const { userId, chatLogId, riskLevel, reason } = req.body;

        const escalation = await Escalation.create({
            userId,
            chatLogId,
            riskLevel,
            reason
        });

        // TODO: Notify counselors via socket/email

        res.status(201).json(escalation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all escalations
// @route   GET /api/escalation
// @access  Private (Counselor/Admin)
const getEscalations = async (req, res) => {
    try {
        const { status } = req.query;
        const query = status ? { status } : {};

        const escalations = await Escalation.find(query)
            .populate('userId', 'name email')
            .populate('assignedTo', 'name')
            .sort({ createdAt: -1 });

        res.json(escalations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update escalation status
// @route   PUT /api/escalation/:id
// @access  Private (Counselor/Admin)
const updateEscalation = async (req, res) => {
    try {
        const { status, notes } = req.body;
        const escalation = await Escalation.findById(req.params.id);

        if (!escalation) {
            return res.status(404).json({ message: 'Escalation not found' });
        }

        if (status) {
            escalation.status = status;
            if (status === 'resolved' || status === 'false-positive') {
                escalation.resolvedAt = Date.now();
            }
        }

        if (notes) {
            escalation.notes.push({
                author: req.user._id,
                content: notes
            });
        }

        // Auto-assign if not assigned
        if (!escalation.assignedTo) {
            escalation.assignedTo = req.user._id;
        }

        await escalation.save();
        res.json(escalation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createEscalation,
    getEscalations,
    updateEscalation
};
