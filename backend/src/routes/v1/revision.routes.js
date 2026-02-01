const express = require('express');
const router = express.Router();
const revisionController = require('../../controllers/revision.controller');
const { auth } = require('../../middleware/auth');
const validate = require('../../middleware/validator');
const { cache } = require('../../middleware/cache');
const { progressValidator } = require('../../utils/validators');

// Use simpler cache middleware - remove invalidateCache from POST routes
router.get('/', auth, cache(30, 'revisions:list'), validate(progressValidator.getRevisions, 'query'), revisionController.getRevisions);
router.get('/today', auth, cache(60, 'revisions:today'), validate(progressValidator.getToday, 'query'), revisionController.getTodayRevisions);
router.get('/upcoming', auth, cache(60, 'revisions:upcoming'), validate(progressValidator.getUpcoming, 'query'), revisionController.getUpcomingRevisions);
router.get('/question/:questionId', auth, cache(30, 'revisions:question'), validate(progressValidator.getQuestionRevision, 'params'), revisionController.getQuestionRevision);

// FIXED: Remove cache middleware from POST/PUT/DELETE routes
router.post('/question/:questionId', auth, validate(progressValidator.createRevision, 'body'), revisionController.createRevision);
router.post('/:revisionId/complete', auth, validate(progressValidator.completeRevision, 'body'), revisionController.completeRevision);
router.post('/question/:questionId/complete', auth, validate(progressValidator.completeRevision, 'body'), revisionController.completeQuestionRevision);
router.put('/:revisionId/reschedule', auth, validate(progressValidator.rescheduleRevision, 'body'), revisionController.rescheduleRevision);
router.delete('/:revisionId', auth, revisionController.deleteRevision);
router.delete('/question/:questionId', auth, revisionController.deleteQuestionRevision);

router.get('/stats', auth, cache(60, 'revisions:stats'), revisionController.getRevisionStats);
router.get('/overdue', auth, cache(30, 'revisions:overdue'), validate(progressValidator.getOverdue, 'query'), revisionController.getOverdueRevisions);

module.exports = router;