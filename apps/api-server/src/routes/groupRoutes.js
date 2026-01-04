const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const GroupMember = require('../models/GroupMember');
const GroupPost = require('../models/GroupPost');
const { protect } = require('../middleware/auth');

// Get all groups (with joined status)
router.get('/', protect, async (req, res) => {
    try {
        const groups = await Group.find().sort('-membersCount');
        const memberships = await GroupMember.find({ userId: req.user.id });
        const joinedGroupIds = memberships.map(m => m.groupId.toString());

        const groupsWithStatus = groups.map(group => ({
            ...group.toObject(),
            isJoined: joinedGroupIds.includes(group._id.toString())
        }));

        res.json(groupsWithStatus);
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new group
router.post('/', protect, async (req, res) => {
    try {
        const { name, description, category, type, icon } = req.body;

        const group = new Group({
            name,
            description,
            category,
            type,
            icon,
            moderatorId: req.user.id,
            membersCount: 1
        });
        await group.save();

        // Add creator as moderator
        await GroupMember.create({
            groupId: group._id,
            userId: req.user.id,
            role: 'moderator'
        });

        res.status(201).json(group);
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Join a group
router.post('/:id/join', protect, async (req, res) => {
    try {
        const groupId = req.params.id;
        const userId = req.user.id;

        const existingMember = await GroupMember.findOne({ groupId, userId });
        if (existingMember) {
            return res.status(400).json({ message: 'Already a member' });
        }

        await GroupMember.create({ groupId, userId });

        // Increment member count
        await Group.findByIdAndUpdate(groupId, { $inc: { membersCount: 1 } });

        res.json({ message: 'Joined group successfully' });
    } catch (error) {
        console.error('Error joining group:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Leave a group
router.post('/:id/leave', protect, async (req, res) => {
    try {
        const groupId = req.params.id;
        const userId = req.user.id;

        const deleted = await GroupMember.findOneAndDelete({ groupId, userId });
        if (!deleted) {
            return res.status(400).json({ message: 'Not a member' });
        }

        // Decrement member count
        await Group.findByIdAndUpdate(groupId, { $inc: { membersCount: -1 } });

        res.json({ message: 'Left group successfully' });
    } catch (error) {
        console.error('Error leaving group:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get group posts
router.get('/:id/posts', protect, async (req, res) => {
    try {
        const posts = await GroupPost.find({ groupId: req.params.id })
            .populate('userId', 'name')
            .sort('-createdAt');
        res.json(posts);
    } catch (error) {
        console.error('Error fetching group posts:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a post in a group
router.post('/:id/posts', protect, async (req, res) => {
    try {
        const { content, isAnonymous } = req.body;
        const groupId = req.params.id;

        // Check membership
        const isMember = await GroupMember.findOne({ groupId, userId: req.user.id });
        if (!isMember) {
            return res.status(403).json({ message: 'Must be a member to post' });
        }

        const post = new GroupPost({
            groupId,
            userId: req.user.id,
            content,
            isAnonymous
        });
        await post.save();

        // Populate user details for immediate display
        await post.populate('userId', 'name');

        res.status(201).json(post);
    } catch (error) {
        console.error('Error creating group post:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
