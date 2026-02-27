const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const subjectRoutes = require('./routes/subjects');
const mediaRoutes = require('./routes/media');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes = require('./routes/admin');
const mcqRoutes = require('./routes/mcq');
const youtubeRoutes = require('./routes/youtube');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// AI endpoint gets stricter rate limiting
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'AI rate limit reached. Please wait a moment.' }
});
app.use('/api/chat/send', aiLimiter);
app.use('/api/media', aiLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mcq', mcqRoutes);
app.use('/api/youtube', youtubeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Smart Study Buddy API is running!',
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   🎓 Smart Study Buddy Pro API          ║
  ║   Running on port ${PORT}                  ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}          ║
  ╚══════════════════════════════════════════╝
  `);
});

module.exports = app;