const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const ForumPost = require('../apps/api-server/src/models/ForumPost');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../apps/api-server/.env') });

const checkFlags = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/student-mental-health');
        console.log('MongoDB Connected');

        const posts = await ForumPost.find({});
        console.log(`Total posts: ${posts.length}`);

        const flagged = await ForumPost.find({ flags: { $gt: 0 } });
        console.log(`Flagged posts: ${flagged.length}`);

        flagged.forEach(p => {
            console.log(`- Post: "${p.title}", Flags: ${p.flags}`);
        });

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkFlags();
