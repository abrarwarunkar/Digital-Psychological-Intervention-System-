const ForumPost = require('../models/ForumPost');

// @desc    Create a new forum post
// @route   POST /api/forum
// @access  Private
const createPost = async (req, res) => {
    try {
        const { title, content, category, isAnonymous } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required' });
        }

        const post = await ForumPost.create({
            userId: req.user._id,
            title,
            content,
            category,
            isAnonymous
        });

        res.status(201).json(post);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all forum posts
// @route   GET /api/forum
// @access  Private
const getPosts = async (req, res) => {
    try {
        const { category } = req.query;
        let query = {};

        if (category && category !== 'All') {
            query.category = category;
        }

        const posts = await ForumPost.find(query)
            .populate('userId', 'name')
            .populate('replies.userId', 'name')
            .sort({ createdAt: -1 });

        // Sanitize anonymous posts
        const sanitizedPosts = posts.map(post => {
            const postObj = post.toObject();
            if (postObj.isAnonymous) {
                postObj.userId = { name: 'Anonymous' };
            }
            postObj.replies = postObj.replies.map(reply => {
                if (reply.isAnonymous) {
                    reply.userId = { name: 'Anonymous' };
                }
                return reply;
            });
            return postObj;
        });

        res.json(sanitizedPosts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add a reply to a post
// @route   POST /api/forum/:id/reply
// @access  Private
const addReply = async (req, res) => {
    try {
        const { content, isAnonymous } = req.body;
        const post = await ForumPost.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const reply = {
            userId: req.user._id,
            content,
            isAnonymous
        };

        post.replies.push(reply);
        await post.save();

        res.json(post);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Flag a post
// @route   POST /api/forum/:id/flag
// @access  Private
const flagPost = async (req, res) => {
    try {
        const post = await ForumPost.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        post.flags += 1;
        await post.save();

        res.json({ message: 'Post flagged' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createPost,
    getPosts,
    addReply,
    flagPost
};
