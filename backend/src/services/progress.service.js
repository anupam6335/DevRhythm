const UserQuestionProgress = require('../models/UserQuestionProgress');
const Question = require('../models/Question');
const { getStartOfDay } = require('../utils/helpers/date');

const calculateProgressStats = async (userId) => {
  const progressRecords = await UserQuestionProgress.find({ userId })
    .populate('questionId', 'difficulty')
    .lean();

  const stats = {
    total: progressRecords.length,
    byStatus: { 'Not Started': 0, 'Attempted': 0, 'Solved': 0, 'Mastered': 0 },
    byDifficulty: { Easy: 0, Medium: 0, Hard: 0 },
    byConfidence: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    totalAttempts: 0,
    totalRevisions: 0,
    totalTimeSpent: 0,
    averageTimePerQuestion: 0,
    averageAttemptsPerQuestion: 0
  };

  progressRecords.forEach(record => {
    stats.byStatus[record.status] = (stats.byStatus[record.status] || 0) + 1;
    if (record.questionId?.difficulty) {
      stats.byDifficulty[record.questionId.difficulty] = (stats.byDifficulty[record.questionId.difficulty] || 0) + 1;
    }
    stats.byConfidence[record.confidenceLevel] = (stats.byConfidence[record.confidenceLevel] || 0) + 1;
    stats.totalAttempts += record.attempts?.count || 0;
    stats.totalRevisions += record.revisionCount || 0;
    stats.totalTimeSpent += record.totalTimeSpent || 0;
  });

  if (progressRecords.length > 0) {
    stats.averageTimePerQuestion = Math.round(stats.totalTimeSpent / progressRecords.length);
    stats.averageAttemptsPerQuestion = Number((stats.totalAttempts / progressRecords.length).toFixed(2));
  }

  return stats;
};

const updateProgressStatus = async (userId, questionId, status, timeSpent = 0) => {
  const updateData = { status, updatedAt: new Date() };
  
  if (timeSpent > 0) {
    updateData.$inc = { totalTimeSpent: timeSpent };
  }

  if (status === 'Solved') {
    updateData.$set = { 
      'attempts.solvedAt': new Date(),
      ...(!updateData.$set ? {} : updateData.$set)
    };
  } else if (status === 'Mastered') {
    updateData.$set = { 
      'attempts.masteredAt': new Date(),
      ...(!updateData.$set ? {} : updateData.$set)
    };
  }

  const progress = await UserQuestionProgress.findOneAndUpdate(
    { userId, questionId },
    updateData,
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  if (!progress.attempts.firstAttemptAt) {
    progress.attempts.firstAttemptAt = new Date();
    await progress.save();
  }

  return progress;
};

const recordQuestionAttempt = async (userId, questionId, timeSpent = 0, successful = false) => {
  const update = {
    $inc: { 'attempts.count': 1, totalTimeSpent: timeSpent },
    $set: { 
      'attempts.lastAttemptAt': new Date(),
      updatedAt: new Date()
    }
  };

  if (successful) {
    update.$set.status = 'Solved';
    update.$set['attempts.solvedAt'] = new Date();
  }

  const progress = await UserQuestionProgress.findOneAndUpdate(
    { userId, questionId },
    update,
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  if (!progress.attempts.firstAttemptAt) {
    progress.attempts.firstAttemptAt = new Date();
    await progress.save();
  }

  return progress;
};

const recordQuestionRevision = async (userId, questionId, timeSpent = 0, confidenceLevel = null) => {
  const update = {
    $inc: { revisionCount: 1, totalTimeSpent: timeSpent },
    $set: { 
      lastRevisedAt: new Date(),
      updatedAt: new Date()
    }
  };

  if (confidenceLevel) {
    update.$set.confidenceLevel = confidenceLevel;
  }

  const progress = await UserQuestionProgress.findOneAndUpdate(
    { userId, questionId },
    update,
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return progress;
};

const updateQuestionCode = async (userId, questionId, language, code) => {
  const progress = await UserQuestionProgress.findOneAndUpdate(
    { userId, questionId },
    {
      $set: {
        savedCode: { language, code, lastUpdated: new Date() },
        updatedAt: new Date()
      }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return progress;
};

const updateQuestionNotes = async (userId, questionId, notes, keyInsights) => {
  const updateData = { updatedAt: new Date() };
  
  if (notes !== undefined) updateData.notes = notes;
  if (keyInsights !== undefined) updateData.keyInsights = keyInsights;

  const progress = await UserQuestionProgress.findOneAndUpdate(
    { userId, questionId },
    { $set: updateData },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return progress;
};

const updateQuestionConfidence = async (userId, questionId, confidenceLevel) => {
  const progress = await UserQuestionProgress.findOneAndUpdate(
    { userId, questionId },
    {
      $set: {
        confidenceLevel,
        updatedAt: new Date()
      }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return progress;
};

const getUserRecentProgress = async (userId, limit = 10) => {
  return await UserQuestionProgress.find({ userId })
    .populate('questionId', '_id title platform difficulty tags pattern')
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean();
};

module.exports = {
  calculateProgressStats,
  updateProgressStatus,
  recordQuestionAttempt,
  recordQuestionRevision,
  updateQuestionCode,
  updateQuestionNotes,
  updateQuestionConfidence,
  getUserRecentProgress
};