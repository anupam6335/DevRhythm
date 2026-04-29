const express = require('express');
const router = express.Router();
const { getDashboard, dashboardCache } = require('../../controllers/dashboard.controller');
const { auth } = require('../../middleware/auth');
const rateLimiters = require('../../middleware/rateLimiter');

/**
 * GET /api/v1/dashboard
 * Returns aggregated dashboard data:
 * - user stats, current goals, goal graph (6 months)
 * - pending revisions (max 5), upcoming count
 * - recent activity (max 5)
 * - heatmap summary, daily problem
 * - unread notifications count, recent notifications (max 5)
 * 
 * Authentication required.
 * Rate limited to 250 requests per 15 minutes (userLimiter).
 * Cached for 30 seconds (dashboardCache).
 */
router.get(
  '/',
  auth,
  rateLimiters.userLimiter,
  dashboardCache,
  getDashboard
);

module.exports = router;