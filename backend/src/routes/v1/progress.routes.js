const express = require('express');
const router = express.Router();
const progressController = require('../../controllers/progress.controller');
const { auth } = require('../../middleware/auth');
const validate = require('../../middleware/validator');
const { progressValidator } = require('../../utils/validators');
const { cache } = require('../../middleware/cache');
const rateLimiters = require('../../middleware/rateLimiter');


router.get('/', auth, cache(10, 'progress:list'), validate(progressValidator.getProgress, 'query'), progressController.getProgress);
router.get('/stats', auth, cache(10, 'progress:stats'), progressController.getProgressStats);
router.get('/recent', auth, cache(10, 'progress:recent'), validate(progressValidator.getRecentProgress, 'query'), progressController.getRecentProgress);
router.get('/question/:questionId', auth, cache(10, 'progress:question'), validate(progressValidator.getQuestionProgress, 'params'), progressController.getQuestionProgress);
router.post('/question/:questionId', auth, rateLimiters.createMemoryLimiter(15 * 60 * 1000, 60), validate(progressValidator.createOrUpdateProgress), progressController.createOrUpdateProgress);
router.put('/status/:questionId', auth, rateLimiters.createMemoryLimiter(15 * 60 * 1000, 60), validate(progressValidator.updateStatus), progressController.updateStatus);
router.put('/code/:questionId', auth, rateLimiters.createMemoryLimiter(15 * 60 * 1000, 60), validate(progressValidator.updateCode), progressController.updateCode);
router.put('/notes/:questionId', auth, rateLimiters.createMemoryLimiter(15 * 60 * 1000, 60), validate(progressValidator.updateNotes), progressController.updateNotes);
router.put('/confidence/:questionId', auth, rateLimiters.createMemoryLimiter(15 * 60 * 1000, 60), validate(progressValidator.updateConfidence), progressController.updateConfidence);
router.post('/attempt/:questionId', auth, rateLimiters.createMemoryLimiter(15 * 60 * 1000, 60), validate(progressValidator.recordAttempt), progressController.recordAttempt);
router.post('/revision/:questionId', auth, rateLimiters.createMemoryLimiter(15 * 60 * 1000, 60), validate(progressValidator.recordRevision), progressController.recordRevision);
router.delete('/question/:questionId', auth, rateLimiters.createMemoryLimiter(15 * 60 * 1000, 60), validate(progressValidator.deleteProgress, 'params'), progressController.deleteProgress);

module.exports = router;