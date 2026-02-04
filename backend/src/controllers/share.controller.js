const crypto = require('crypto');
const Share = require('../models/Share');
const User = require('../models/User');
const UserQuestionProgress = require('../models/UserQuestionProgress');
const Question = require('../models/Question');
const { formatResponse, paginate, getPaginationParams, formatDate } = require('../utils/helpers');
const { invalidateCache } = require('../middleware/cache');
const AppError = require('../utils/errors/AppError');

const generateShareToken = () => crypto.randomBytes(16).toString('hex');

const getShares = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const { shareType, periodType, privacy, startDate, endDate, sortBy, sortOrder } = req.query;
    const query = { userId: req.user._id };
    if (shareType) query.shareType = shareType;
    if (periodType) query.periodType = periodType;
    if (privacy) query.privacy = privacy;
    if (startDate) query.startDate = { $gte: new Date(startDate) };
    if (endDate) query.endDate = { $lte: new Date(endDate) };
    const sort = {};
    sort[sortBy || 'createdAt'] = sortOrder === 'asc' ? 1 : -1;
    const [shares, total] = await Promise.all([
      Share.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Share.countDocuments(query)
    ]);
    res.json(formatResponse('Shares retrieved successfully', { shares }, { pagination: paginate(total, page, limit) }));
  } catch (error) {
    next(error);
  }
};

const getShareById = async (req, res, next) => {
  try {
    const share = await Share.findOne({ _id: req.params.id, $or: [{ userId: req.user._id }, { privacy: 'public' }] }).populate('userId', 'username displayName avatarUrl').lean();
    if (!share) throw new AppError('Share not found or insufficient permissions', 404);
    if (share.userId._id.toString() !== req.user._id.toString() && share.privacy !== 'public') throw new AppError('Unauthorized access', 403);
    res.json(formatResponse('Share retrieved successfully', { share }));
  } catch (error) {
    next(error);
  }
};

const createShare = async (req, res, next) => {
  try {
    const { shareType, periodType, startDate, endDate, customPeriodName, privacy, expiresInDays, includeQuestions, questionLimit } = req.body;
    const user = await User.findById(req.user._id).select('username displayName avatarUrl').lean();
    if (!user) throw new AppError('User not found', 404);
    
    // Initialize shared data with user info
    const sharedData = {
      userInfo: {
        username: user.username,
        displayName: user.displayName || user.username,
        avatarUrl: user.avatarUrl,
        totalSolved: 0,
        streak: { current: 0, longest: 0 }
      },
      totalSolved: 0,
      breakdown: { easy: 0, medium: 0, hard: 0 },
      platformBreakdown: { LeetCode: 0, HackerRank: 0, CodeForces: 0, Other: 0 }
    };
    
    if (shareType === 'period') {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Build base query - ONE TIME
      const progressQuery = { 
        userId: req.user._id, 
        status: { $in: ['Solved', 'Mastered'] } 
      };
      
      if (includeQuestions) {
        progressQuery.updatedAt = { $gte: start, $lte: end };
      }
      
      // SINGLE QUERY: Get all progress with question data in one go
      const solvedProgress = await UserQuestionProgress.aggregate([
        { $match: progressQuery },
        // Join with questions collection
        {
          $lookup: {
            from: 'questions',
            localField: 'questionId',
            foreignField: '_id',
            as: 'question'
          }
        },
        { $unwind: { path: '$question', preserveNullAndEmptyArrays: false } },
        // Sort for pagination
        { $sort: { updatedAt: -1 } },
        // Limit if we only need limited list for questions
        ...(includeQuestions ? [{ $limit: questionLimit || 50 }] : [])
      ]);
      
      // Process the solved progress records in memory - much faster
      const solvedQuestions = [];
      const breakdown = { easy: 0, medium: 0, hard: 0 };
      const platformBreakdown = { LeetCode: 0, HackerRank: 0, CodeForces: 0, Other: 0 };
      
      solvedProgress.forEach(p => {
        const question = p.question;
        if (question) {
          // Build question object for the list
          if (includeQuestions) {
            solvedQuestions.push({
              title: question.title || '',
              problemLink: question.problemLink || '',
              platform: question.platform || '',
              difficulty: question.difficulty || '',
              solvedDate: p.updatedAt,
              tags: question.tags || [],
              pattern: question.pattern || ''
            });
          }
          
          // Difficulty breakdown
          const difficulty = question.difficulty;
          if (difficulty === 'Easy') breakdown.easy++;
          else if (difficulty === 'Medium') breakdown.medium++;
          else if (difficulty === 'Hard') breakdown.hard++;
          
          // Platform breakdown
          const platform = question.platform || '';
          if (platform === 'LeetCode') platformBreakdown.LeetCode++;
          else if (platform === 'HackerRank') platformBreakdown.HackerRank++;
          else if (platform === 'CodeForces') platformBreakdown.CodeForces++;
          else if (platform) platformBreakdown.Other++;
        }
      });
      
      // Get total count SEPARATELY but without populate (much faster)
      const totalSolvedCount = includeQuestions 
        ? solvedProgress.length 
        : await UserQuestionProgress.countDocuments(progressQuery);
      
      // Assign data
      sharedData.questions = solvedQuestions;
      sharedData.totalSolved = totalSolvedCount;
      sharedData.breakdown = breakdown;
      sharedData.platformBreakdown = platformBreakdown;
      sharedData.dateRange = { start, end };
      sharedData.userInfo.totalSolved = totalSolvedCount;
      
    } else {
      // Profile share - optimized single query
      const solvedProgress = await UserQuestionProgress.aggregate([
        { 
          $match: { 
            userId: req.user._id, 
            status: { $in: ['Solved', 'Mastered'] } 
          } 
        },
        // Join with questions collection
        {
          $lookup: {
            from: 'questions',
            localField: 'questionId',
            foreignField: '_id',
            as: 'question'
          }
        },
        { $unwind: { path: '$question', preserveNullAndEmptyArrays: false } }
      ]);
      
      const breakdown = { easy: 0, medium: 0, hard: 0 };
      const platformBreakdown = { LeetCode: 0, HackerRank: 0, CodeForces: 0, Other: 0 };
      
      solvedProgress.forEach(p => {
        const question = p.question;
        if (question) {
          // Difficulty breakdown
          const difficulty = question.difficulty;
          if (difficulty === 'Easy') breakdown.easy++;
          else if (difficulty === 'Medium') breakdown.medium++;
          else if (difficulty === 'Hard') breakdown.hard++;
          
          // Platform breakdown
          const platform = question.platform || '';
          if (platform === 'LeetCode') platformBreakdown.LeetCode++;
          else if (platform === 'HackerRank') platformBreakdown.HackerRank++;
          else if (platform === 'CodeForces') platformBreakdown.CodeForces++;
          else if (platform) platformBreakdown.Other++;
        }
      });
      
      const totalSolvedCount = solvedProgress.length;
      
      sharedData.totalSolved = totalSolvedCount;
      sharedData.breakdown = breakdown;
      sharedData.platformBreakdown = platformBreakdown;
      sharedData.userInfo.totalSolved = totalSolvedCount;
    }
    
    // Generate token and create share
    const shareToken = generateShareToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (expiresInDays || 30));
    
    const share = await Share.create({
      userId: req.user._id,
      shareType,
      periodType,
      startDate,
      endDate,
      customPeriodName,
      sharedData,
      privacy,
      shareToken,
      expiresAt
    });
    
    // Cache invalidation - non-blocking
    invalidateCache(`shares:*:user:${req.user._id}:*`).catch(console.error);
    
    res.status(201).json(formatResponse('Share created successfully', {
      share,
      shareUrl: `${process.env.FRONTEND_URL || 'https://devrhythm.com'}/share/${shareToken}`
    }));
  } catch (error) {
    next(error);
  }
};

const updateShare = async (req, res, next) => {
  try {
    const { privacy, expiresInDays, customPeriodName } = req.body;
    const updateData = {};
    if (privacy) updateData.privacy = privacy;
    if (expiresInDays) {
      updateData.expiresAt = new Date();
      updateData.expiresAt.setDate(updateData.expiresAt.getDate() + expiresInDays);
    }
    if (customPeriodName) updateData.customPeriodName = customPeriodName;
    updateData.updatedAt = new Date();
    const share = await Share.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );
    if (!share) throw new AppError('Share not found', 404);
    invalidateCache(`shares:*:user:${req.user._id}:*`).catch(console.error);
    invalidateCache(`share:${req.params.id}`).catch(console.error);
    res.json(formatResponse('Share updated successfully', { share }));
  } catch (error) {
    next(error);
  }
};

const deleteShare = async (req, res, next) => {
  try {
    const share = await Share.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!share) throw new AppError('Share not found', 404);
    invalidateCache(`shares:*:user:${req.user._id}:*`).catch(console.error);
    invalidateCache(`share:${req.params.id}`).catch(console.error);
    invalidateCache(`share:token:${share.shareToken}`).catch(console.error);
    res.json(formatResponse('Share deleted successfully'));
  } catch (error) {
    next(error);
  }
};

const getShareByToken = async (req, res, next) => {
  try {
    const share = await Share.findOne({ shareToken: req.params.token }).populate('userId', 'username displayName avatarUrl').lean();
    if (!share) throw new AppError('Share not found or expired', 404);
    if (share.privacy === 'private') throw new AppError('Share is private', 403);
    if (share.expiresAt && new Date() > share.expiresAt) throw new AppError('Share has expired', 410);
    
    // Non-blocking update for access count
    Share.updateOne({ _id: share._id }, { 
      $inc: { accessCount: 1 }, 
      $set: { lastAccessedAt: new Date() } 
    }).catch(console.error);
    
    res.json(formatResponse('Shared data retrieved successfully', { share }));
  } catch (error) {
    next(error);
  }
};

const getUserPublicShares = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req);
    const { shareType, periodType } = req.query;
    const user = await User.findOne({ username: req.params.username }).select('_id').lean();
    if (!user) throw new AppError('User not found', 404);
    const query = { userId: user._id, privacy: 'public' };
    if (shareType) query.shareType = shareType;
    if (periodType) query.periodType = periodType;
    const [shares, total] = await Promise.all([
      Share.find(query).populate('userId', 'username displayName avatarUrl').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Share.countDocuments(query)
    ]);
    if (shares.length === 0) throw new AppError('No public shares found', 404);
    res.json(formatResponse('Public shares retrieved successfully', { shares }, { pagination: paginate(total, page, limit) }));
  } catch (error) {
    next(error);
  }
};

const refreshShare = async (req, res, next) => {
  try {
    const { includeQuestions, questionLimit } = req.body;
    const share = await Share.findOne({ _id: req.params.id, userId: req.user._id });
    if (!share) throw new AppError('Share not found', 404);
    
    if (share.shareType === 'period') {
      const start = share.startDate;
      const end = share.endDate;
      
      // Build base query
      const progressQuery = { 
        userId: req.user._id, 
        status: { $in: ['Solved', 'Mastered'] } 
      };
      
      if (includeQuestions) {
        progressQuery.updatedAt = { $gte: start, $lte: end };
      }
      
      // SINGLE QUERY with aggregation
      const solvedProgress = await UserQuestionProgress.aggregate([
        { $match: progressQuery },
        {
          $lookup: {
            from: 'questions',
            localField: 'questionId',
            foreignField: '_id',
            as: 'question'
          }
        },
        { $unwind: { path: '$question', preserveNullAndEmptyArrays: false } },
        { $sort: { updatedAt: -1 } },
        ...(includeQuestions ? [{ $limit: questionLimit || 50 }] : [])
      ]);
      
      // Process in memory
      const solvedQuestions = [];
      const breakdown = { easy: 0, medium: 0, hard: 0 };
      const platformBreakdown = { LeetCode: 0, HackerRank: 0, CodeForces: 0, Other: 0 };
      
      solvedProgress.forEach(p => {
        const question = p.question;
        if (question) {
          if (includeQuestions) {
            solvedQuestions.push({
              title: question.title || '',
              problemLink: question.problemLink || '',
              platform: question.platform || '',
              difficulty: question.difficulty || '',
              solvedDate: p.updatedAt,
              tags: question.tags || [],
              pattern: question.pattern || ''
            });
          }
          
          // Difficulty breakdown
          const difficulty = question.difficulty;
          if (difficulty === 'Easy') breakdown.easy++;
          else if (difficulty === 'Medium') breakdown.medium++;
          else if (difficulty === 'Hard') breakdown.hard++;
          
          // Platform breakdown
          const platform = question.platform || '';
          if (platform === 'LeetCode') platformBreakdown.LeetCode++;
          else if (platform === 'HackerRank') platformBreakdown.HackerRank++;
          else if (platform === 'CodeForces') platformBreakdown.CodeForces++;
          else if (platform) platformBreakdown.Other++;
        }
      });
      
      const totalSolvedCount = includeQuestions 
        ? solvedProgress.length 
        : await UserQuestionProgress.countDocuments(progressQuery);
      
      // Update share data
      share.sharedData.questions = solvedQuestions;
      share.sharedData.totalSolved = totalSolvedCount;
      share.sharedData.breakdown = breakdown;
      share.sharedData.platformBreakdown = platformBreakdown;
      share.sharedData.userInfo.totalSolved = totalSolvedCount;
    }
    
    share.updatedAt = new Date();
    await share.save();
    
    // Non-blocking cache invalidation
    invalidateCache(`shares:*:user:${req.user._id}:*`).catch(console.error);
    invalidateCache(`share:${req.params.id}`).catch(console.error);
    
    res.json(formatResponse('Share data refreshed successfully', { share }));
  } catch (error) {
    next(error);
  }
};

const resetShareToken = async (req, res, next) => {
  try {
    const share = await Share.findOne({ _id: req.params.id, userId: req.user._id });
    if (!share) throw new AppError('Share not found', 404);
    const oldToken = share.shareToken;
    share.shareToken = generateShareToken();
    share.updatedAt = new Date();
    await share.save();
    invalidateCache(`share:${req.params.id}`).catch(console.error);
    invalidateCache(`share:token:${oldToken}`).catch(console.error);
    res.json(formatResponse('Share token reset successfully', {
      newToken: share.shareToken,
      newShareUrl: `${process.env.FRONTEND_URL || 'https://devrhythm.com'}/share/${share.shareToken}`
    }));
  } catch (error) {
    next(error);
  }
};

const getShareStats = async (req, res, next) => {
  try {
    const shares = await Share.find({ userId: req.user._id }).lean();
    const stats = {
      totalShares: shares.length,
      activeShares: shares.filter(s => !s.expiresAt || new Date() < s.expiresAt).length,
      expiredShares: shares.filter(s => s.expiresAt && new Date() > s.expiresAt).length,
      totalAccesses: shares.reduce((sum, s) => sum + (s.accessCount || 0), 0),
      byShareType: { profile: 0, period: 0 },
      byPeriodType: { day: 0, week: 0, month: 0, custom: 0 },
      byPrivacy: { public: 0, private: 0, 'link-only': 0 },
      mostAccessed: null
    };
    shares.forEach(share => {
      stats.byShareType[share.shareType]++;
      if (share.shareType === 'period' && share.periodType) stats.byPeriodType[share.periodType]++;
      stats.byPrivacy[share.privacy]++;
      if (!stats.mostAccessed || share.accessCount > stats.mostAccessed.accessCount) {
        stats.mostAccessed = {
          shareId: share._id,
          accessCount: share.accessCount,
          shareType: share.shareType
        };
      }
    });
    res.json(formatResponse('Share statistics retrieved', { stats }));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getShares,
  getShareById,
  createShare,
  updateShare,
  deleteShare,
  getShareByToken,
  getUserPublicShares,
  refreshShare,
  resetShareToken,
  getShareStats
};