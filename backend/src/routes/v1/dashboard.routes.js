const express = require('express');
const router = express.Router();
const { getDashboard, dashboardCache } = require('../../controllers/dashboard.controller');
const { auth } = require('../../middleware/auth');
const { attachUserTimeZone } = require('../../middleware/timezone');   
const rateLimiters = require('../../middleware/rateLimiter');

/**
 * GET /api/v1/dashboard
 * Returns aggregated dashboard data.
 * Authentication required.
 * Rate limited to 250 requests per 15 minutes (userLimiter).
 * Cached for 15 seconds (reduced from 30 to optimize memory on free Redis tier).
 */
router.get(
  '/',
  auth,
  attachUserTimeZone,       
  rateLimiters.userLimiter,
  dashboardCache,   // duration is set inside the cache middleware (15 seconds)
  getDashboard
);

module.exports = router;