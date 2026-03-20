const express = require('express');
const router = express.Router();
const progressController = require('../../controllers/progress.controller');
const { auth } = require('../../middleware/auth');
const validate = require('../../middleware/validator');
const { progressValidator } = require('../../utils/validators');
const { cache } = require('../../middleware/cache');
const rateLimiters = require('../../middleware/rateLimiter');

router.get('/', auth, rateLimiters.userLimiter, cache(10, 'progress:list'), validate(progressValidator.getProgress, 'query'), progressController.getProgress);
router.get('/stats', auth, rateLimiters.userLimiter, cache(10, 'progress:stats'), progressController.getProgressStats);
router.get('/recent', auth, rateLimiters.userLimiter, cache(10, 'progress:recent'), validate(progressValidator.getRecentProgress, 'query'), progressController.getRecentProgress);
router.get('/question/:questionId', auth, rateLimiters.userLimiter, cache(10, 'progress:question'), validate(progressValidator.getQuestionProgress, 'params'), progressController.getQuestionProgress);
router.post('/question/:questionId', auth, rateLimiters.progressUpdateLimiter, validate(progressValidator.createOrUpdateProgress), progressController.createOrUpdateProgress);
router.put('/status/:questionId', auth, rateLimiters.progressUpdateLimiter, validate(progressValidator.updateStatus), progressController.updateStatus);
router.put('/code/:questionId', auth, rateLimiters.progressUpdateLimiter, validate(progressValidator.updateCode), progressController.updateCode);
router.put('/notes/:questionId', auth, rateLimiters.progressUpdateLimiter, validate(progressValidator.updateNotes), progressController.updateNotes);
router.put('/confidence/:questionId', auth, rateLimiters.progressUpdateLimiter, validate(progressValidator.updateConfidence), progressController.updateConfidence); // note: disabled in controller
router.post('/attempt/:questionId', auth, rateLimiters.progressUpdateLimiter, validate(progressValidator.recordAttempt), progressController.recordAttempt);
router.post('/revision/:questionId', auth, rateLimiters.progressUpdateLimiter, validate(progressValidator.recordRevision), progressController.recordRevision);
router.delete('/question/:questionId', auth, rateLimiters.progressUpdateLimiter, validate(progressValidator.deleteProgress, 'params'), progressController.deleteProgress);
router.get('/by-personal-difficulty', auth, rateLimiters.userLimiter, validate(progressValidator.getByPersonalDifficulty, 'query'), progressController.getQuestionsByPersonalDifficulty);

module.exports = router;