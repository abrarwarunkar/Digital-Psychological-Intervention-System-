const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const ScreeningResult = require('../apps/api-server/src/models/ScreeningResult');
const ForumPost = require('../apps/api-server/src/models/ForumPost');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../apps/api-server/.env') });

const clearAnalytics = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/student-mental-health');
        console.log('MongoDB Connected');

        // Delete all screenings and forum posts to reset
        const deleteScreenings = await ScreeningResult.deleteMany({});
        const deletePosts = await ForumPost.deleteMany({});

        console.log(`Cleared ${deleteScreenings.deletedCount} screenings.`);
        console.log(`Cleared ${deletePosts.deletedCount} forum posts.`);

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

clearAnalytics();
