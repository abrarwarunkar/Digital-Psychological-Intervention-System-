const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    isAnonymous: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const forumPostSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['General', 'Anxiety', 'Depression', 'Academic Stress', 'Relationships'],
        default: 'General'
    },
    isAnonymous: {
        type: Boolean,
        default: false
    },
    replies: [replySchema],
    flags: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

const ForumPost = mongoose.model('ForumPost', forumPostSchema);

module.exports = ForumPost;
