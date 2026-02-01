const Joi = require('joi');

const getProgress = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('Not Started', 'Attempted', 'Solved', 'Mastered'),
  questionId: Joi.string().hex().length(24),
  sortBy: Joi.string().valid('updatedAt', 'createdAt', 'lastRevisedAt', 'attempts.count', 'confidenceLevel').default('updatedAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  minConfidence: Joi.number().integer().min(1).max(5),
  maxConfidence: Joi.number().integer().min(1).max(5)
});

const getQuestionProgress = Joi.object({
  questionId: Joi.string().hex().length(24).required()
});

const createOrUpdateProgress = Joi.object({
  status: Joi.string().valid('Not Started', 'Attempted', 'Solved', 'Mastered'),
  notes: Joi.string().allow('').max(5000),
  keyInsights: Joi.string().allow('').max(1000),
  savedCode: Joi.object({
    language: Joi.string().required(),
    code: Joi.string().required()
  }),
  confidenceLevel: Joi.number().integer().min(1).max(5),
  timeSpent: Joi.number().integer().min(0).max(480)
});

const updateStatus = Joi.object({
  status: Joi.string().valid('Not Started', 'Attempted', 'Solved', 'Mastered').required()
});

const updateCode = Joi.object({
  language: Joi.string().required(),
  code: Joi.string().required()
});

const updateNotes = Joi.object({
  notes: Joi.string().allow('').max(5000),
  keyInsights: Joi.string().allow('').max(1000)
});

const updateConfidence = Joi.object({
  confidenceLevel: Joi.number().integer().min(1).max(5).required()
});

const recordAttempt = Joi.object({
  timeSpent: Joi.number().integer().min(0).max(480).default(0),
  successful: Joi.boolean().default(false)
});

const recordRevision = Joi.object({
  timeSpent: Joi.number().integer().min(0).max(480).default(0),
  confidenceLevel: Joi.number().integer().min(1).max(5)
});

const deleteProgress = Joi.object({
  questionId: Joi.string().hex().length(24).required()
});

const getRecentProgress = Joi.object({
  limit: Joi.number().integer().min(1).max(50).default(10)
});

const getRevisions = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('active', 'completed', 'overdue'),
  questionId: Joi.string().hex().length(24),
  sortBy: Joi.string().valid('schedule', 'baseDate', 'currentRevisionIndex', 'updatedAt').default('schedule'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc')
});

const getToday = Joi.object({
  date: Joi.date().default(() => new Date().toISOString().split('T')[0])
});

const getUpcoming = Joi.object({
  startDate: Joi.date().default(() => new Date().toISOString().split('T')[0]),
  endDate: Joi.date().default(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  })
});

const getQuestionRevision = Joi.object({
  questionId: Joi.string().hex().length(24).required()
});

const createRevision = Joi.object({
  baseDate: Joi.date().default(() => new Date()),
  schedule: Joi.array().items(Joi.date()).length(5).optional()
});

const completeRevision = Joi.object({
  completedAt: Joi.date().default(() => new Date()),
  status: Joi.string().valid('completed', 'skipped').default('completed'),
  confidenceLevel: Joi.number().integer().min(1).max(5)
});

const rescheduleRevision = Joi.object({
  newDate: Joi.date().required(),
  revisionIndex: Joi.number().integer().min(0).max(4).required()
});

const getOverdue = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(20)
});

module.exports = {
  getProgress,
  getQuestionProgress,
  createOrUpdateProgress,
  updateStatus,
  updateCode,
  updateNotes,
  updateConfidence,
  recordAttempt,
  recordRevision,
  deleteProgress,
  getRecentProgress,
  getRevisions,
  getToday,
  getUpcoming,
  getQuestionRevision,
  createRevision,
  completeRevision,
  rescheduleRevision,
  getOverdue
};