const Resource = require('../models/Resource');

// @desc    Get all resources
// @route   GET /api/resources
// @access  Private
const getAllResources = async (req, res) => {
    try {
        const { category } = req.query;
        let query = {};

        if (category && category !== 'All') {
            query.category = category;
        }

        const resources = await Resource.find(query).sort({ createdAt: -1 });
        res.json(resources);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create a resource (Admin only - simplified for now)
// @route   POST /api/resources
// @access  Private
const createResource = async (req, res) => {
    try {
        const { title, description, category, url, type } = req.body;

        if (!title || !description || !category || !url) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const resource = await Resource.create({
            title,
            description,
            category,
            url,
            type
        });

        res.status(201).json(resource);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getAllResources,
    createResource
};
