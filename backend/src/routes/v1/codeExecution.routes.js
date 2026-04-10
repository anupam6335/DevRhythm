const express = require('express');
const router = express.Router();
const codeExecutionController = require('../../controllers/codeExecution.controller');
const { auth } = require('../../middleware/auth');
const validate = require('../../middleware/validator');
const Joi = require('joi');
const CodeExecutionHistory = require('../../models/CodeExecutionHistory');
const { formatResponse } = require('../../utils/helpers/response');

const testCaseSchema = Joi.object({
  stdin: Joi.string().allow('').default(''),
  expected: Joi.string().allow('').optional(),
});

const executeSchema = Joi.object({
  language: Joi.string().valid('cpp', 'python', 'java', 'javascript').required(),
  code: Joi.string().required(),
  questionId: Joi.string().hex().length(24).required(),
  stdin: Joi.string().allow('').optional(),
  expected: Joi.string().allow('').optional(),
  testCases: Joi.array().items(testCaseSchema).optional(),
})
.with('expected', 'stdin'); 

router.post('/execute',
  auth,
  validate(executeSchema),
  codeExecutionController.runCode
);

router.get('/history', auth, async (req, res, next) => {
  try {
    const { questionId, limit = 20, page = 1 } = req.query;
    const query = { userId: req.user._id };
    if (questionId) query.questionId = questionId;
    const history = await CodeExecutionHistory.find(query)
      .sort({ executedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();
    res.json(formatResponse('History retrieved', { history }));
  } catch (error) {
    next(error);
  }
});

module.exports = router;