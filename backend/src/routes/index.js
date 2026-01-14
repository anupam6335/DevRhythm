const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const dayRoutes = require('./day.routes');
const questionRoutes = require('./question.routes');
const timerRoutes = require('./timer.routes');
const revisionRoutes = require('./revision.routes');
const analyticsRoutes = require('./analytics.routes');
const achievementRoutes = require('./achievement.routes');
const knowledgeGraphRoutes = require('./knowledgeGraph.routes');
const studyPlanRoutes = require('./studyPlan.routes');
const notificationRoutes = require('./notification.routes');
const onboardingRoutes = require('./onboarding.routes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/days', dayRoutes);
router.use('/questions', questionRoutes);
router.use('/timers', timerRoutes);
router.use('/revisions', revisionRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/achievements', achievementRoutes);
router.use('/knowledge-graph', knowledgeGraphRoutes);
router.use('/study-plans', studyPlanRoutes);
router.use('/notifications', notificationRoutes);
router.use('/onboarding', onboardingRoutes);

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV
  });
});

module.exports = router;