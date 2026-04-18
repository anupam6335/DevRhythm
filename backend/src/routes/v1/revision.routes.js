const express = require('express');
const router = express.Router();
const revisionController = require('../../controllers/revision.controller');
const { auth } = require('../../middleware/auth');
const validate = require('../../middleware/validator');
const { cache } = require('../../middleware/cache');
const { progressValidator } = require('../../utils/validators');
const rateLimiters = require('../../middleware/rateLimiter');
const Joi = require('joi');

router.get('/', auth, rateLimiters.userLimiter, cache(30, 'revisions:list'), validate(progressValidator.getRevisions, 'query'), revisionController.getRevisions);
router.get('/today', auth, rateLimiters.userLimiter, cache(60, 'revisions:today'), validate(progressValidator.getToday, 'query'), revisionController.getTodayRevisions);
router.get('/upcoming', auth, rateLimiters.userLimiter, cache(60, 'revisions:upcoming'), validate(progressValidator.getUpcoming, 'query'), revisionController.getUpcomingRevisions);
router.get('/question/:questionId', auth, rateLimiters.userLimiter, cache(30, 'revisions:question'), validate(progressValidator.getQuestionRevision, 'params'), revisionController.getQuestionRevision);
router.get('/by-platform/:platform/:platformQuestionId',
  auth,
  rateLimiters.userLimiter,
  cache(30, 'revisions:question'),
  validate(Joi.object({
    platform: Joi.string().valid('LeetCode', 'Codeforces', 'HackerRank', 'AtCoder', 'CodeChef', 'Other').required(),
    platformQuestionId: Joi.string().required()
  }), 'params'),
  revisionController.getQuestionRevisionByPlatform
);
router.post('/question/:questionId', auth, rateLimiters.progressUpdateLimiter, validate(progressValidator.createRevision, 'body'), revisionController.createRevision);
router.post('/:revisionId/complete', auth, rateLimiters.revisionCompleteLimiter, validate(progressValidator.completeRevision, 'body'), revisionController.completeRevision);
router.post('/question/:questionId/complete', auth, rateLimiters.revisionCompleteLimiter, validate(progressValidator.completeRevision, 'body'), revisionController.completeQuestionRevision);
router.post('/:questionId/time-spent', auth, rateLimiters.revisionCompleteLimiter, validate(Joi.object({ minutes: Joi.number().integer().min(1).max(480).required() }), 'body'), revisionController.recordTimeSpent);
router.put('/:revisionId/reschedule', auth, rateLimiters.progressUpdateLimiter, validate(progressValidator.rescheduleRevision, 'body'), revisionController.rescheduleRevision);
router.delete('/:revisionId', auth, rateLimiters.progressUpdateLimiter, revisionController.deleteRevision);
router.delete('/question/:questionId', auth, rateLimiters.progressUpdateLimiter, revisionController.deleteQuestionRevision);
router.get('/stats',
  auth,
  rateLimiters.userLimiter,
  cache(60, 'revisions:stats'),
  (req, res, next) => {
    if (req.query.detailed === 'true') {
      return revisionController.getDetailedRevisionStats(req, res, next);
    }
    return revisionController.getRevisionStats(req, res, next);
  }
);
router.get('/overdue', auth, rateLimiters.userLimiter, cache(30, 'revisions:overdue'), validate(progressValidator.getOverdue, 'query'), revisionController.getOverdueRevisions);

module.exports = router;