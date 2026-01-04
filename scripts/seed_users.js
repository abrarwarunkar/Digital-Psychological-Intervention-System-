const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../apps/api-server/src/models/User');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../apps/api-server/.env') });

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/student-mental-health');
        console.log('MongoDB Connected');

        // Clear existing users with these emails
        await User.deleteMany({ email: { $in: ['student@test.com', 'admin@test.com'] } });

        // Create Student
        const student = await User.create({
            name: 'Test Student',
            email: 'student@test.com',
            passwordHash: 'password123',
            role: 'student',
            consentGiven: true
        });
        console.log('Student created:', student.email);

        // Create Admin
        const admin = await User.create({
            name: 'Test Admin',
            email: 'admin@test.com',
            passwordHash: 'password123',
            role: 'admin',
            consentGiven: true
        });
        console.log('Admin created:', admin.email);

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedUsers();
