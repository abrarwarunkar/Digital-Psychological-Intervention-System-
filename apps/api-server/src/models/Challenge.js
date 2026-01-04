const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['daily', 'weekly', 'milestone'],
        default: 'daily'
    },
    points: {
        type: Number,
        required: true,
        default: 10
    },
    criteria: {
        type: {
            type: String,
            enum: ['mood_log', 'screening', 'journal', 'resource_view'],
            required: true
        },
        count: {
            type: Number,
            default: 1
        }
    },
    icon: {
        type: String, // Emoji or URL
        default: '🎯'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    startDate: Date,
    endDate: Date
}, {
    timestamps: true
});

module.exports = mongoose.model('Challenge', challengeSchema);
