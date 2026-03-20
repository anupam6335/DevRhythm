const express = require('express');
const router = express.Router();
const revisionController = require('../../controllers/revision.controller');
const { auth } = require('../../middleware/auth');
const validate = require('../../middleware/validator');
const { cache } = require('../../middleware/cache');
const { progressValidator } = require('../../utils/validators');
const rateLimiters = require('../../middleware/rateLimiter');

router.get('/', auth, rateLimiters.userLimiter, cache(30, 'revisions:list'), validate(progressValidator.getRevisions, 'query'), revisionController.getRevisions);
router.get('/today', auth, rateLimiters.userLimiter, cache(60, 'revisions:today'), validate(progressValidator.getToday, 'query'), revisionController.getTodayRevisions);
router.get('/upcoming', auth, rateLimiters.userLimiter, cache(60, 'revisions:upcoming'), validate(progressValidator.getUpcoming, 'query'), revisionController.getUpcomingRevisions);
router.get('/question/:questionId', auth, rateLimiters.userLimiter, cache(30, 'revisions:question'), validate(progressValidator.getQuestionRevision, 'params'), revisionController.getQuestionRevision);
router.post('/question/:questionId', auth, rateLimiters.progressUpdateLimiter, validate(progressValidator.createRevision, 'body'), revisionController.createRevision);
router.post('/:revisionId/complete', auth, rateLimiters.revisionCompleteLimiter, validate(progressValidator.completeRevision, 'body'), revisionController.completeRevision);
router.post('/question/:questionId/complete', auth, rateLimiters.revisionCompleteLimiter, validate(progressValidator.completeRevision, 'body'), revisionController.completeQuestionRevision);
router.put('/:revisionId/reschedule', auth, rateLimiters.progressUpdateLimiter, validate(progressValidator.rescheduleRevision, 'body'), revisionController.rescheduleRevision);
router.delete('/:revisionId', auth, rateLimiters.progressUpdateLimiter, revisionController.deleteRevision);
router.delete('/question/:questionId', auth, rateLimiters.progressUpdateLimiter, revisionController.deleteQuestionRevision);
router.get('/stats', auth, rateLimiters.userLimiter, cache(60, 'revisions:stats'), revisionController.getRevisionStats);
router.get('/overdue', auth, rateLimiters.userLimiter, cache(30, 'revisions:overdue'), validate(progressValidator.getOverdue, 'query'), revisionController.getOverdueRevisions);

module.exports = router;