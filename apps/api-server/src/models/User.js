const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'counsellor', 'admin', 'volunteer'],
        default: 'student'
    },
    phone: {
        type: String,
        trim: true
    },
    consentGiven: {
        type: Boolean,
        default: false,
        required: true
    },
    anonymousPref: {
        type: Boolean,
        default: false
    },
    profile: {
        // Flexible profile field for additional data
        type: Map,
        of: String
    },
    gamification: {
        points: { type: Number, default: 0 },
        streak: { type: Number, default: 0 },
        lastActivityDate: { type: Date },
        badges: [{ type: String }], // Array of Badge IDs
        completedChallenges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' }]
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('passwordHash')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.passwordHash);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
