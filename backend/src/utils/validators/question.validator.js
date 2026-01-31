const Joi = require('joi');

const getQuestions = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  platform: Joi.string().valid('LeetCode', 'Codeforces', 'HackerRank', 'AtCoder', 'CodeChef', 'Other'),
  difficulty: Joi.string().valid('Easy', 'Medium', 'Hard'),
  pattern: Joi.string().trim(),
  tags: Joi.array().items(Joi.string().trim()).single(),
  search: Joi.string().trim().min(1).max(100),
});

const getQuestionById = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

const createQuestion = Joi.object({
  title: Joi.string().trim().required().min(2).max(200),
  problemLink: Joi.string().uri().required(),
  platform: Joi.string().valid('LeetCode', 'Codeforces', 'HackerRank', 'AtCoder', 'CodeChef', 'Other').required(),
  platformQuestionId: Joi.string().required(),
  difficulty: Joi.string().valid('Easy', 'Medium', 'Hard').required(),
  tags: Joi.array().items(Joi.string().trim()).default([]),
  pattern: Joi.string().trim().default(''),
  solutionLinks: Joi.array().items(Joi.string().uri()).default([]),
  similarQuestions: Joi.array().items(Joi.string().hex().length(24)).default([]),
  contentRef: Joi.string().uri().allow(''),
});

const updateQuestion = Joi.object({
  title: Joi.string().trim().min(2).max(200),
  problemLink: Joi.string().uri(),
  platform: Joi.string().valid('LeetCode', 'Codeforces', 'HackerRank', 'AtCoder', 'CodeChef', 'Other'),
  platformQuestionId: Joi.string(),
  difficulty: Joi.string().valid('Easy', 'Medium', 'Hard'),
  tags: Joi.array().items(Joi.string().trim()),
  pattern: Joi.string().trim(),
  solutionLinks: Joi.array().items(Joi.string().uri()),
  similarQuestions: Joi.array().items(Joi.string().hex().length(24)),
  contentRef: Joi.string().uri().allow(''),
}).min(1);

const deleteQuestion = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

const getQuestionByPlatformId = Joi.object({
  platform: Joi.string().valid('LeetCode', 'Codeforces', 'HackerRank', 'AtCoder', 'CodeChef', 'Other').required(),
  platformQuestionId: Joi.string().required(),
});

const getSimilarQuestions = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

const restoreQuestion = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

const permanentDeleteQuestion = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

const getDeletedQuestions = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  platform: Joi.string().valid('LeetCode', 'Codeforces', 'HackerRank', 'AtCoder', 'CodeChef', 'Other'),
  difficulty: Joi.string().valid('Easy', 'Medium', 'Hard'),
  pattern: Joi.string().trim(),
  tags: Joi.array().items(Joi.string().trim()).single(),
  search: Joi.string().trim().min(1).max(100),
});

module.exports = {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionByPlatformId,
  getSimilarQuestions,
  restoreQuestion,
  permanentDeleteQuestion,
  getDeletedQuestions,
};