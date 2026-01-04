const mongoose = require('mongoose');

const chatLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    sender: {
        type: String,
        enum: ['user', 'bot'],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    riskLevel: {
        type: String,
        enum: ['no-risk', 'low', 'medium', 'high', 'emergency'],
        default: 'low'
    },
    intent: {
        type: String,
        default: 'general'
    },
    confidence: {
        type: Number,
        default: 0.0
    },
    isEmergency: {
        type: Boolean,
        default: false
    }
});

const ChatLog = mongoose.model('ChatLog', chatLogSchema);

module.exports = ChatLog;
