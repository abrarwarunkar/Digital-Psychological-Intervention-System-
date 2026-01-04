const mongoose = require('mongoose');

const groupMemberSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['member', 'moderator'],
        default: 'member'
    },
    joinedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to prevent duplicate memberships
groupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('GroupMember', groupMemberSchema);
