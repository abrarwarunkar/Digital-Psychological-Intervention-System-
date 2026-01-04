const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../apps/api-server/src/models/User');
const Availability = require('../apps/api-server/src/models/Availability');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../apps/api-server/.env') });

const mumbaiCenters = [
    {
        name: "KEM Hospital – Psychiatry Dept.",
        email: "psychiatry@kem.edu",
        address: "Acharya Donde Marg, Parel, Mumbai 400012",
        contact: "022-24131212"
    },
    {
        name: "Bombay Hospital – Psychiatry Dept.",
        email: "psychiatry@bombayhospital.com",
        address: "MRC Building, 1st Floor, Mumbai",
        contact: "022-22067676"
    },
    {
        name: "Gleneagles Hospital – Psychiatry",
        email: "psychiatry@gleneagles.com",
        address: "Parel, Mumbai",
        contact: "022 6767 0202"
    },
    {
        name: "Wockhardt Hospitals (Mira Road)",
        email: "psychiatry@wockhardt.com",
        address: "Mira Road, Mumbai",
        contact: "Contact Hospital"
    },
    {
        name: "Cloudnine Hospital (Malad West)",
        email: "psychiatry@cloudnine.com",
        address: "Malad West, Mumbai",
        contact: "Contact Hospital"
    },
    {
        name: "SL Raheja Hospital – Psychiatry",
        email: "psychiatry@slraheja.com",
        address: "Mahim, Mumbai",
        contact: "Contact Hospital"
    },
    {
        name: "Nanavati Max Hospital – Psychiatry",
        email: "psychiatry@nanavati.com",
        address: "Vile Parle, Mumbai",
        contact: "Contact Hospital"
    },
    {
        name: "Somaiya Ayurvihar Hospital",
        email: "psychiatry@somaiya.edu",
        address: "Sion (E), Mumbai",
        contact: "022 6112 4800"
    },
    {
        name: "Mindsight Clinic",
        email: "info@mindsight.com",
        address: "Malad West, Mumbai",
        contact: "Contact Clinic"
    },
    {
        name: "Dr Ketan Parmar Psychiatrist Centre",
        email: "drketan@parmar.com",
        address: "Borivali East, Mumbai",
        contact: "Contact Clinic"
    }
];

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    }
};

const seedCounsellors = async () => {
    await connectDB();

    console.log('Seeding Mumbai Counsellors...');

    for (const center of mumbaiCenters) {
        try {
            // Check if exists
            let user = await User.findOne({ email: center.email });
            if (user) {
                console.log(`User ${center.name} already exists. Skipping.`);
            } else {
                user = await User.create({
                    name: center.name,
                    email: center.email,
                    passwordHash: 'password123', // Will be hashed by pre-save
                    role: 'counsellor',
                    consentGiven: true,
                    profile: {
                        address: center.address,
                        contact: center.contact,
                        specialization: 'General Psychiatry'
                    }
                });
                console.log(`Created user: ${center.name}`);
            }

            // Create Availability (Mon-Fri, 9-5)
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
            for (const day of days) {
                const exists = await Availability.findOne({ counsellorId: user._id, dayOfWeek: day });
                if (!exists) {
                    await Availability.create({
                        counsellorId: user._id,
                        dayOfWeek: day,
                        startTime: '09:00',
                        endTime: '17:00'
                    });
                }
            }
            console.log(`Added availability for ${center.name}`);

        } catch (error) {
            console.error(`Error creating ${center.name}:`, error.message);
        }
    }

    console.log('Seeding complete.');
    process.exit(0);
};

seedCounsellors();
