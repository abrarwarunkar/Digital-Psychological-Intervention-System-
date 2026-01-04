const express = require('express');
const router = express.Router();
const { getAllResources, createResource } = require('../controllers/resourceController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getAllResources);
router.post('/', protect, authorize('admin'), createResource);

module.exports = router;
