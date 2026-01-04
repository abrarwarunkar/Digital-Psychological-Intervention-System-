const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['Anxiety', 'Depression', 'Stress', 'Sleep', 'General'],
        required: true
    },
    url: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['article', 'video', 'pdf', 'website'],
        default: 'article'
    }
}, {
    timestamps: true
});

const Resource = mongoose.model('Resource', resourceSchema);

module.exports = Resource;
