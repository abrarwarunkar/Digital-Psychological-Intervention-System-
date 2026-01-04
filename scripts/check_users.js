const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../apps/api-server/src/models/User');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../apps/api-server/.env') });

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/student-mental-health');
        console.log('MongoDB Connected');

        const users = await User.find({});
        console.log(`Total users: ${users.length}`);

        users.forEach(u => {
            console.log(`- User: ${u.email}, Role: ${u.role}, ID: ${u._id}`);
        });

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkUsers();
