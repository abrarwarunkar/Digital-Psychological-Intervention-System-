const mongoose = require('mongoose');

const screeningResultSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['PHQ9', 'GAD7'],
        required: true
    },
    answers: [{
        qid: Number,
        answer: Number // 0-3
    }],
    score: {
        type: Number,
        required: true
    },
    riskLevel: {
        type: String,
        enum: ['none', 'mild', 'moderate', 'moderately severe', 'severe'],
        required: true
    }
}, {
    timestamps: true
});

const ScreeningResult = mongoose.model('ScreeningResult', screeningResultSchema);

module.exports = ScreeningResult;
