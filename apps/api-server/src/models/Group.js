const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['Anxiety', 'Depression', 'Academic Stress', 'Relationships', 'General', 'LGBTQ+', 'Grief'],
        default: 'General'
    },
    type: {
        type: String,
        enum: ['public', 'private'],
        default: 'public'
    },
    moderatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    membersCount: {
        type: Number,
        default: 1
    },
    icon: {
        type: String,
        default: '👥'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Group', groupSchema);
