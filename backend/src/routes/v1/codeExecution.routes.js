const express = require('express');
const router = express.Router();
const codeExecutionController = require('../../controllers/codeExecution.controller');
const { auth } = require('../../middleware/auth');
const validate = require('../../middleware/validator');
const Joi = require('joi');

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

module.exports = router;