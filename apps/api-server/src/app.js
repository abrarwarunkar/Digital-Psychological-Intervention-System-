const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const screeningRoutes = require('./routes/screeningRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const chatRoutes = require('./routes/chatRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const forumRoutes = require('./routes/forumRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/screening', screeningRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/gamification', require('./routes/gamification'));
app.use('/api/mood', require('./routes/moodRoutes'));
app.use('/api/escalation', require('./routes/escalationRoutes'));
app.use('/api/recommendations', require('./routes/recommendationRoutes'));

module.exports = app;
