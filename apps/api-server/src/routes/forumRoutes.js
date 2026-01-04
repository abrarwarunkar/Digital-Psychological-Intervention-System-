const express = require('express');
const router = express.Router();
const { createPost, getPosts, addReply, flagPost } = require('../controllers/forumController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createPost);
router.get('/', protect, getPosts);
router.post('/:id/reply', protect, addReply);
router.post('/:id/flag', protect, flagPost);

module.exports = router;
