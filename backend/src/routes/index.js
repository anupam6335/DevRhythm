const express = require('express');
const router = express.Router();

// Import route modules (these will be implemented later)
// const authRoutes = require('./auth.routes');
// const userRoutes = require('./user.routes');
// const questionRoutes = require('./question.routes');
// const dayRoutes = require('./day.routes');
// const analyticsRoutes = require('./analytics.routes');

// Health check route
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'DevRhythm API'
  });
});

// API status route
router.get('/status', (req, res) => {
  res.json({
    status: 'operational',
    version: '1.0.0',
    endpoints: {
      auth: '/auth',
      users: '/users',
      questions: '/questions',
      days: '/days',
      analytics: '/analytics'
    }
  });
});

// Mount route modules (uncomment when implemented)
// router.use('/auth', authRoutes);
// router.use('/users', userRoutes);
// router.use('/questions', questionRoutes);
// router.use('/days', dayRoutes);
// router.use('/analytics', analyticsRoutes);

module.exports = router;