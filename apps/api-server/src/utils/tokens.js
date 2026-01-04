const jwt = require('jsonwebtoken');

const generateAccessToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            role: user.role,
            name: user.name
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user._id },
        process.env.REFRESH_SECRET,
        { expiresIn: '7d' }
    );
};

const verifyAccessToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.REFRESH_SECRET);
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken
};
