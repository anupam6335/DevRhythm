const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const questionRoutes = require('./question.routes');
const progressRoutes = require('./progress.routes');
const revisionRoutes = require('./revision.routes');
const goalRoutes = require('./goal.routes');
const shareRoutes = require('./share.routes');
const studyGroupRoutes = require('./studyGroup.routes');
const followRoutes = require('./follow.routes');
const heatmapRoutes = require('./heatmap.routes');
const patternMasteryRoutes = require('./patternMastery.routes');

router.get('/health', (req, res) => {
  res.json({
    success: true,
    statusCode: 200,
    message: 'Service Healthy',
    data: {
      service: 'devrhythm-backend',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      redis: 'connected',
      cloudinary: 'connected',
      version: '1.0.0',
      instanceId: process.env.RAILWAY_INSTANCE_ID || 'local'
    },
    meta: {},
    error: null
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/questions', questionRoutes);
router.use('/progress', progressRoutes);
router.use('/revisions', revisionRoutes);
router.use('/goals', goalRoutes);
router.use('/shares', shareRoutes);
router.use('/study-groups', studyGroupRoutes);
router.use('/follow', followRoutes);
router.use('/heatmap', heatmapRoutes);
router.use('/pattern-mastery', patternMasteryRoutes);

module.exports = router;