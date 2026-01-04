const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const ScreeningResult = require('../apps/api-server/src/models/ScreeningResult');
const ForumPost = require('../apps/api-server/src/models/ForumPost');
const User = require('../apps/api-server/src/models/User');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../apps/api-server/.env') });

const seedAnalytics = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/student-mental-health');
        console.log('MongoDB Connected');

        const student = await User.findOne({ email: 'student@test.com' });
        if (!student) {
            console.log('Student not found, please run seed_users.js first');
            process.exit(1);
        }

        console.log('Seeding Screening Results...');
        // Create screenings for last 30 days
        const screenings = [];
        const riskLevels = ['none', 'mild', 'moderate', 'severe'];

        for (let i = 0; i < 30; i++) {
            // Random number of screenings per day
            const count = Math.floor(Math.random() * 5);
            for (let j = 0; j < count; j++) {
                const date = new Date();
                date.setDate(date.getDate() - i);

                screenings.push({
                    userId: student._id,
                    type: 'PHQ9',
                    score: Math.floor(Math.random() * 27),
                    riskLevel: riskLevels[Math.floor(Math.random() * riskLevels.length)],
                    answers: [],
                    createdAt: date,
                    updatedAt: date
                });
            }
        }
        await ScreeningResult.insertMany(screenings);
        console.log(`Added ${screenings.length} screening results`);

        console.log('Seeding Forum Posts...');
        const posts = [
            { title: 'Anxiety about exams', content: 'I am feeling very anxious about my upcoming finals. I cannot sleep properly.' },
            { title: 'Feeling lonely', content: 'I feel lonely and isolated on campus. It is hard to make friends.' },
            { title: 'Stress management', content: 'How do you handle stress? I am overwhelmed with assignments.' },
            { title: 'Depression help', content: 'I think I might have depression. I have no motivation to do anything.' },
            { title: 'Sleep problems', content: 'My sleep schedule is messed up. I stay up all night worrying.' }
        ];

        const forumPosts = posts.map(p => ({
            userId: student._id,
            title: p.title,
            content: p.content,
            category: 'General',
            isAnonymous: true,
            createdAt: new Date()
        }));

        await ForumPost.insertMany(forumPosts);
        console.log(`Added ${forumPosts.length} forum posts`);

        console.log('Analytics seeding complete!');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedAnalytics();
