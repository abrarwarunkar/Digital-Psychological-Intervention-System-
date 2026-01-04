const mongoose = require('mongoose');

const moodEntrySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    mood: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    note: {
        type: String,
        trim: true,
        maxlength: 500
    },
    tags: [{
        type: String,
        trim: true
    }],
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient querying by user and date
moodEntrySchema.index({ userId: 1, timestamp: -1 });

const MoodEntry = mongoose.model('MoodEntry', moodEntrySchema);

module.exports = MoodEntry;
