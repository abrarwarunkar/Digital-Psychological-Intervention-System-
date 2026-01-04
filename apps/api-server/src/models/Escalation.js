const mongoose = require('mongoose');

const escalationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    chatLogId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatLog'
    },
    riskLevel: {
        type: String,
        enum: ['high', 'emergency'],
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'in-progress', 'resolved', 'false-positive'],
        default: 'pending'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Counselor or Admin
    },
    notes: [{
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        content: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    resolvedAt: Date
});

const Escalation = mongoose.model('Escalation', escalationSchema);

module.exports = Escalation;
