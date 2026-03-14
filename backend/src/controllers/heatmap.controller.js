const HeatmapData = require('../models/HeatmapData');
const User = require('../models/User');
const heatmapService = require('../services/heatmap.service');
const { formatResponse } = require('../utils/helpers/response');
const { getPaginationParams, paginate } = require('../utils/helpers/pagination');
const { getStartOfDay, getEndOfDay, formatDate } = require('../utils/helpers/date');
const AppError = require('../utils/errors/AppError');
const { invalidateCache } = require('../middleware/cache');
const config = require('../config');
const { client: redisClient } = require('../config/redis');
const { jobQueue } = require('../services/queue.service');
const { v4: uuidv4 } = require('uuid');

// Helper: check if a heatmap generation job is pending for a user/year
const isHeatmapJobPending = async (userId, year) => {
  const exists = await redisClient.exists(`devrhythm:heatmap:pending:${userId}:${year}`);
  return exists === 1;
};

// Helper: enqueue a heatmap generation job and store pending flag
const enqueueHeatmapGeneration = async (userId, year, forceFullRefresh = false) => {
  const jobId = `heatmap_${userId}_${year}_${Date.now()}_${uuidv4().slice(0, 8)}`;
  // Set pending flag with 5-minute TTL (job should complete within that time)
  await redisClient.setEx(`devrhythm:heatmap:pending:${userId}:${year}`, 300, jobId);
  await jobQueue.add({
    type: 'heatmap.generate',
    userId,
    year,
    forceFullRefresh,
  });
  return jobId;
};

/**
 * Get heatmap for current year (or specified year)
 */
const getHeatmap = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const includeCache = req.query.includeCache !== 'false';

    let heatmap = await HeatmapData.findOne({ 
      userId: req.user._id, 
      year 
    }).lean();

    // If heatmap doesn't exist, handle async generation
    if (!heatmap) {
      // Check if generation is already pending
      const pending = await isHeatmapJobPending(req.user._id, year);
      if (pending) {
        return res.status(202).json({
          success: true,
          statusCode: 202,
          message: 'Heatmap generation is in progress. Please try again shortly.',
          data: {
            year,
            status: 'generating',
            // Return minimal placeholder data
            dailyData: [],
            performance: {},
            consistency: {},
            statsPanel: {}
          },
          meta: {
            year,
            jobId: pending
          },
          error: null
        });
      }

      // No heatmap and no pending job → start generation
      const jobId = await enqueueHeatmapGeneration(req.user._id, year);
      return res.status(202).json({
        success: true,
        statusCode: 202,
        message: 'Heatmap generation started. Check back later.',
        data: {
          year,
          status: 'generating',
          dailyData: [],
          performance: {},
          consistency: {},
          statsPanel: {}
        },
        meta: {
          year,
          jobId,
          estimatedCompletion: new Date(Date.now() + 2 * 60 * 1000) // rough estimate
        },
        error: null
      });
    }

    // Heatmap exists – return it
    const response = {
      year: heatmap.year,
      weekCount: heatmap.weekCount,
      firstDate: heatmap.firstDate,
      lastDate: heatmap.lastDate,
      dailyData: heatmap.dailyData,
      performance: heatmap.performance,
      consistency: heatmap.consistency,
      statsPanel: heatmap.statsPanel
    };
    if (includeCache && heatmap.cachedRenderData) {
      response.cachedRenderData = heatmap.cachedRenderData;
    }

    res.json(formatResponse('Heatmap data retrieved successfully', response, {
      year,
      lastUpdated: heatmap.lastUpdated
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get heatmap for a specific year (path parameter)
 */
const getHeatmapByYear = async (req, res, next) => {
  try {
    const year = parseInt(req.params.year);
    const includeCache = req.query.includeCache !== 'false';

    if (year < 2000 || year > 2100) {
      throw new AppError('Invalid year specified', 400);
    }

    let heatmap = await HeatmapData.findOne({ 
      userId: req.user._id, 
      year 
    }).lean();

    // If heatmap doesn't exist, handle async generation
    if (!heatmap) {
      const pending = await isHeatmapJobPending(req.user._id, year);
      if (pending) {
        return res.status(202).json({
          success: true,
          statusCode: 202,
          message: 'Heatmap generation is in progress. Please try again shortly.',
          data: {
            year,
            status: 'generating',
            dailyData: [],
            performance: {},
            consistency: {},
            statsPanel: {}
          },
          meta: {
            year,
            jobId: pending
          },
          error: null
        });
      }

      const jobId = await enqueueHeatmapGeneration(req.user._id, year);
      return res.status(202).json({
        success: true,
        statusCode: 202,
        message: 'Heatmap generation started. Check back later.',
        data: {
          year,
          status: 'generating',
          dailyData: [],
          performance: {},
          consistency: {},
          statsPanel: {}
        },
        meta: {
          year,
          jobId,
          estimatedCompletion: new Date(Date.now() + 2 * 60 * 1000)
        },
        error: null
      });
    }

    const response = {
      year: heatmap.year,
      weekCount: heatmap.weekCount,
      firstDate: heatmap.firstDate,
      lastDate: heatmap.lastDate,
      dailyData: heatmap.dailyData,
      performance: heatmap.performance,
      consistency: heatmap.consistency,
      statsPanel: heatmap.statsPanel
    };
    if (includeCache && heatmap.cachedRenderData) {
      response.cachedRenderData = heatmap.cachedRenderData;
    }

    res.json(formatResponse('Heatmap data retrieved successfully', response, {
      year,
      lastUpdated: heatmap.lastUpdated
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh/regenerate heatmap (trigger background job)
 */
const refreshHeatmap = async (req, res, next) => {
  try {
    const year = parseInt(req.body.year) || new Date().getFullYear();
    const forceFullRefresh = req.body.forceFullRefresh === true;

    if (year < 2000 || year > 2100) {
      throw new AppError('Invalid year specified', 400);
    }

    // Invalidate caches
    await invalidateCache(`heatmap:${req.user._id}:${year}:*`);
    await invalidateCache(`heatmap:stats:${req.user._id}:${year}`);
    await invalidateCache(`heatmap:filter:${req.user._id}:${year}:*`);

    // Enqueue job
    const jobId = await enqueueHeatmapGeneration(req.user._id, year, forceFullRefresh);

    res.status(202).json(formatResponse('Heatmap recalculation started', {
      jobId,
      estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000)
    }, {
      year,
      refreshType: forceFullRefresh ? 'full' : 'incremental'
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get heatmap statistics (no generation needed – uses existing data)
 */
const getHeatmapStats = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const heatmap = await HeatmapData.findOne({ 
      userId: req.user._id, 
      year 
    }).lean();

    if (!heatmap || !heatmap.statsPanel) {
      // If no stats, we could trigger background generation, but for stats we'll just return 404
      throw new AppError('Heatmap data not found', 404);
    }

    res.json(formatResponse('Heatmap statistics retrieved', heatmap.statsPanel, {
      year,
      calculatedAt: heatmap.lastUpdated
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get filtered heatmap (uses existing data or calculates on the fly – may be heavy, but limited scope)
 */
const getFilteredHeatmap = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const viewType = req.query.viewType || 'all';
    const weekStart = parseInt(req.query.weekStart) || 1;
    const weekEnd = parseInt(req.query.weekEnd) || 53;

    const validViewTypes = [
      'all', 'new_problems', 'revisions', 'study_group', 
      'leetcode', 'hackerrank', 'codeforces', 'easy', 'medium', 'hard'
    ];

    if (!validViewTypes.includes(viewType)) {
      throw new AppError('Invalid view type', 400);
    }

    const heatmap = await HeatmapData.findOne({ 
      userId: req.user._id, 
      year 
    }).lean();

    if (!heatmap) {
      // Could also trigger generation, but for simplicity, return 404
      throw new AppError('Heatmap data not found', 404);
    }

    let filteredData = [];
    let totalActivities = 0;
    let maxInDay = 0;

    if (viewType === 'all') {
      filteredData = heatmap.dailyData;
    } else if (heatmap.filterViews && heatmap.filterViews[viewType]) {
      filteredData = heatmap.dailyData.map((day, index) => ({
        ...day,
        totalActivities: heatmap.filterViews[viewType][index] || 0,
        intensityLevel: heatmapService.calculateIntensityLevel(heatmap.filterViews[viewType][index] || 0)
      }));
    } else {
      // On‑the‑fly calculation – may be slow, but acceptable for occasional use
      filteredData = await heatmapService.calculateFilteredData(req.user._id, year, viewType);
    }

    filteredData.forEach(day => {
      totalActivities += day.totalActivities;
      if (day.totalActivities > maxInDay) maxInDay = day.totalActivities;
    });

    const consistencyScore = heatmap.consistency?.consistencyScore || 0;
    const averagePerDay = filteredData.length > 0 ? totalActivities / filteredData.length : 0;

    res.json(formatResponse('Filtered heatmap data retrieved', {
      viewType,
      dailyData: filteredData,
      summary: {
        totalActivities,
        averagePerDay: parseFloat(averagePerDay.toFixed(1)),
        maxInDay,
        consistencyScore: parseFloat(consistencyScore.toFixed(1))
      }
    }, {
      year,
      filterApplied: viewType,
      weekRange: `${weekStart}-${weekEnd}`
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * Export heatmap data (generates export as JSON/CSV)
 */
const exportHeatmap = async (req, res, next) => {
  try {
    const year = parseInt(req.body.year) || new Date().getFullYear();
    const format = req.body.format || 'json';
    const includeDetails = req.body.includeDetails === true;

    const heatmap = await HeatmapData.findOne({ 
      userId: req.user._id, 
      year 
    }).lean();

    if (!heatmap) {
      throw new AppError('Heatmap data not found for export', 404);
    }

    const exportId = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    let exportData;
    if (format === 'csv') {
      exportData = heatmapService.convertToCSV(heatmap, includeDetails);
    } else {
      exportData = includeDetails ? heatmap : {
        year: heatmap.year,
        dailyData: heatmap.dailyData.map(day => ({
          date: day.date,
          totalActivities: day.totalActivities,
          newProblemsSolved: day.newProblemsSolved,
          revisionProblems: day.revisionProblems,
          intensityLevel: day.intensityLevel
        })),
        performance: heatmap.performance,
        consistency: heatmap.consistency
      };
    }

    const size = Buffer.byteLength(JSON.stringify(exportData), 'utf8');
    const sizeKB = (size / 1024).toFixed(1);

    const downloadUrl = `${config.backendUrl}/api/v1/heatmap/export/${exportId}?format=${format}`;

    await redisClient.setEx(`export:${exportId}`, 24 * 60 * 60, JSON.stringify({
      userId: req.user._id.toString(),
      userDisplayName: req.user.displayName,
      year,
      format,
      data: exportData,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString()
    }));

    res.json(formatResponse('Heatmap export generated', {
      exportId,
      downloadUrl,
      expiresAt,
      format,
      size: `${sizeKB}KB`
    }, {
      year,
      exportedAt: new Date()
    }));
  } catch (error) {
    next(error);
  }
};

/**
 * Download exported heatmap data
 */
const downloadExport = async (req, res, next) => {
  try {
    const { exportId } = req.params;
    const format = req.query.format || 'json';

    const exportKey = `export:${exportId}`;
    const exportData = await redisClient.get(exportKey);

    if (!exportData) {
      throw new AppError('Export not found or expired', 404);
    }

    const parsedExport = JSON.parse(exportData);

    if (parsedExport.userId !== req.user._id.toString()) {
      throw new AppError('Unauthorized to access this export', 403);
    }

    const safeDisplayName = (parsedExport.userDisplayName || req.user.displayName || 'User')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 50);

    const filename = `DevRhythm_${safeDisplayName}_${parsedExport.year}.${format}`;

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(parsedExport.data);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(JSON.stringify(parsedExport.data, null, 2));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get public heatmap for another user (read‑only, minimal data)
 */
const getPublicUserHeatmap = async (req, res, next) => {
  try {
    const { userId, year } = req.params;
    const simple = req.query.simple === 'true';
    const includeCache = req.query.includeCache !== 'false';
    const parsedYear = parseInt(year);
    if (isNaN(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
      throw new AppError('Invalid year', 400);
    }

    const user = await User.findById(userId).select('_id');
    if (!user) throw new AppError('User not found', 404);

    const heatmap = await heatmapService.getOrCreateHeatmap(userId, parsedYear);
    if (!heatmap) throw new AppError('Heatmap data not found', 404);

    let response;
    if (simple) {
      response = heatmapService.extractMinimalHeatmap(heatmap);
    } else {
      response = {
        year: heatmap.year,
        weekCount: heatmap.weekCount,
        firstDate: heatmap.firstDate,
        lastDate: heatmap.lastDate,
        dailyData: heatmap.dailyData,
        performance: heatmap.performance,
        consistency: heatmap.consistency,
        statsPanel: heatmap.statsPanel,
      };
      if (includeCache && heatmap.cachedRenderData) {
        response.cachedRenderData = heatmap.cachedRenderData;
      }
    }

    res.json(formatResponse('Public heatmap retrieved successfully', response, {
      userId,
      year: parsedYear,
      lastUpdated: heatmap.lastUpdated,
    }));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHeatmap,
  getHeatmapByYear,
  refreshHeatmap,
  getHeatmapStats,
  getFilteredHeatmap,
  exportHeatmap,
  downloadExport,
  getPublicUserHeatmap
};