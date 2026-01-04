const mongoose = require('mongoose');

const sessionSummarySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sessionId: {
        type: String, // Could be a date or a unique session ID
        required: true
    },
    summary: {
        type: String,
        required: true
    },
    mainConcerns: [{
        type: String
    }],
    copingStrategies: [{
        type: String
    }],
    riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high', 'emergency'],
        default: 'low'
    },
    actionItems: [{
        type: String
    }],
    isAiGenerated: {
        type: Boolean,
        default: true
    },
    counselorNotes: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const SessionSummary = mongoose.model('SessionSummary', sessionSummarySchema);

module.exports = SessionSummary;
