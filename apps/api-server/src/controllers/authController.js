const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokens');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const { name, email, password, role, consentGiven, anonymousPref } = req.body;

        if (!name || !email || !password || !consentGiven) {
            return res.status(400).json({ message: 'Please add all required fields' });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            passwordHash: password,
            role: role || 'student',
            consentGiven,
            anonymousPref: anonymousPref || false
        });

        if (user) {
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                accessToken: generateAccessToken(user),
                refreshToken: generateRefreshToken(user)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user email
        const user = await User.findOne({ email });

        if (user && (await user.comparePassword(password))) {
            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                accessToken: generateAccessToken(user),
                refreshToken: generateRefreshToken(user)
            });
        } else {
            res.status(400).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refresh = async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ message: 'No refresh token provided' });
    }

    try {
        const decoded = verifyRefreshToken(refreshToken);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        const accessToken = generateAccessToken(user);

        res.json({ accessToken });
    } catch (error) {
        return res.status(403).json({ message: 'Invalid refresh token' });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res) => {
    // Client should discard tokens. 
    // Optionally, blacklist refresh token here if DB storage is implemented.
    res.json({ message: 'Logged out successfully' });
};

// @desc    Get user data
// @route   GET /api/users/me
// @access  Private
const getMe = async (req, res) => {
    res.status(200).json(req.user);
};

module.exports = {
    register,
    login,
    refresh,
    logout,
    getMe
};
