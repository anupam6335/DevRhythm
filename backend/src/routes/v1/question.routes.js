const express = require('express');
const router = express.Router();
const questionController = require('../../controllers/question.controller');
const { auth } = require('../../middleware/auth');
const validate = require('../../middleware/validator');
const { questionValidator } = require('../../utils/validators');
const { cache } = require('../../middleware/cache');
const rateLimiters = require('../../middleware/rateLimiter');

router.get('/', auth, cache(300, 'questions:list'), validate(questionValidator.getQuestions, 'query'), questionController.getQuestions);
router.get('/patterns', auth, cache(1800, 'questions:patterns'), questionController.getPatterns);
router.get('/tags', auth, cache(1800, 'questions:tags'), questionController.getTags);
router.get('/statistics', auth, cache(3600, 'questions:statistics'), questionController.getStatistics);
router.get('/deleted', auth, cache(300, 'questions:deleted'), validate(questionValidator.getQuestions, 'query'), questionController.getDeletedQuestions);
router.get('/:id', auth, cache(3600, 'question'), validate(questionValidator.getQuestionById, 'params'), questionController.getQuestionById);
router.get('/platform/:platform/:platformQuestionId', auth, cache(3600, 'question:platform'), validate(questionValidator.getQuestionByPlatformId, 'params'), questionController.getQuestionByPlatformId);
router.get('/similar/:id', auth, cache(3600, 'question:similar'), validate(questionValidator.getSimilarQuestions, 'params'), questionController.getSimilarQuestions);
router.post('/', auth, rateLimiters.createMemoryLimiter(15 * 60 * 1000, 50), validate(questionValidator.createQuestion), questionController.createQuestion);
router.put('/:id', auth, rateLimiters.createMemoryLimiter(15 * 60 * 1000, 50), validate(questionValidator.updateQuestion), questionController.updateQuestion);
router.delete('/:id', auth, rateLimiters.createMemoryLimiter(15 * 60 * 1000, 50), validate(questionValidator.deleteQuestion, 'params'), questionController.deleteQuestion);
router.post('/:id/restore', auth, rateLimiters.createMemoryLimiter(15 * 60 * 1000, 50), validate(questionValidator.restoreQuestion, 'params'), questionController.restoreQuestion);
router.delete('/:id/permanent', auth, rateLimiters.createMemoryLimiter(15 * 60 * 1000, 50), validate(questionValidator.permanentDeleteQuestion, 'params'), questionController.permanentDeleteQuestion);

module.exports = router;