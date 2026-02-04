const express = require('express');
const router = express.Router();
const studyGroupController = require('../../controllers/studyGroup.controller');
const { auth } = require('../../middleware/auth');
const validate = require('../../middleware/validator');
const Joi = require('joi');
const { cache } = require('../../middleware/cache');

const paginationSchema = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
};

router.get('/', auth, validate(Joi.object({
  ...paginationSchema,
  privacy: Joi.string().valid('public', 'private', 'invite-only'),
  search: Joi.string().trim().min(1).max(100),
  sortBy: Joi.string().valid('createdAt', 'lastActivityAt', 'memberCount').default('lastActivityAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
}), 'query'), cache(60, 'study-groups:list'), studyGroupController.getGroups);

router.post('/', auth, validate(Joi.object({
  name: Joi.string().trim().required().min(3).max(100),
  description: Joi.string().trim().max(1000).allow(''),
  privacy: Joi.string().valid('public', 'private', 'invite-only').default('invite-only')
})), studyGroupController.createGroup);

router.get('/my', auth, validate(Joi.object(paginationSchema), 'query'), cache(30, 'study-groups:user:membership'), studyGroupController.getMyGroups);

router.get('/:groupId', auth, validate(Joi.object({
  groupId: Joi.string().hex().length(24).required()
}), 'params'), cache(30, 'study-group'), studyGroupController.getGroup);

router.put('/:groupId', auth, validate(Joi.object({
  groupId: Joi.string().hex().length(24).required()
}), 'params'), validate(Joi.object({
  name: Joi.string().trim().min(3).max(100),
  description: Joi.string().trim().max(1000).allow(''),
  privacy: Joi.string().valid('public', 'private', 'invite-only')
})), studyGroupController.updateGroup);

router.delete('/:groupId', auth, validate(Joi.object({
  groupId: Joi.string().hex().length(24).required()
}), 'params'), studyGroupController.deleteGroup);

router.post('/:groupId/join', auth, validate(Joi.object({
  groupId: Joi.string().hex().length(24).required()
}), 'params'), studyGroupController.joinGroup);

router.post('/:groupId/leave', auth, validate(Joi.object({
  groupId: Joi.string().hex().length(24).required()
}), 'params'), studyGroupController.leaveGroup);

router.delete('/:groupId/members/:userId', auth, validate(Joi.object({
  groupId: Joi.string().hex().length(24).required(),
  userId: Joi.string().hex().length(24).required()
}), 'params'), studyGroupController.removeMember);

router.post('/:groupId/goals', auth, validate(Joi.object({
  groupId: Joi.string().hex().length(24).required()
}), 'params'), validate(Joi.object({
  description: Joi.string().trim().required().min(5).max(500),
  targetCount: Joi.number().integer().min(1).required(),
  deadline: Joi.date().required()
})), studyGroupController.createGoal);

router.post('/:groupId/goals/:goalId/join', auth, validate(Joi.object({
  groupId: Joi.string().hex().length(24).required(),
  goalId: Joi.string().hex().length(24).required()
}), 'params'), studyGroupController.joinGoal);

router.post('/:groupId/goals/:goalId/progress', auth, validate(Joi.object({
  groupId: Joi.string().hex().length(24).required(),
  goalId: Joi.string().hex().length(24).required()
}), 'params'), validate(Joi.object({
  progress: Joi.number().integer().min(0).required()
})), studyGroupController.updateGoalProgress);

router.post('/:groupId/challenges', auth, validate(Joi.object({
  groupId: Joi.string().hex().length(24).required()
}), 'params'), validate(Joi.object({
  name: Joi.string().trim().required().min(3).max(100),
  description: Joi.string().trim().max(500),
  challengeType: Joi.string().valid('sprint', 'marathon', 'difficulty-focused', 'pattern-focused').required(),
  target: Joi.number().integer().min(1).required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required().greater(Joi.ref('startDate'))
})), studyGroupController.createChallenge);

router.post('/:groupId/challenges/:challengeId/join', auth, validate(Joi.object({
  groupId: Joi.string().hex().length(24).required(),
  challengeId: Joi.string().hex().length(24).required()
}), 'params'), studyGroupController.joinChallenge);

router.post('/:groupId/challenges/:challengeId/progress', auth, validate(Joi.object({
  groupId: Joi.string().hex().length(24).required(),
  challengeId: Joi.string().hex().length(24).required()
}), 'params'), validate(Joi.object({
  progress: Joi.number().integer().min(0).max(100).required()
})), studyGroupController.updateChallengeProgress);

router.get('/:groupId/activity', auth, validate(Joi.object({
  groupId: Joi.string().hex().length(24).required()
}), 'params'), validate(Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(20)
}), 'query'), cache(30, 'study-group:activity'), studyGroupController.getGroupActivity);

router.get('/:groupId/stats', auth, validate(Joi.object({
  groupId: Joi.string().hex().length(24).required()
}), 'params'), cache(60, 'study-group:stats'), studyGroupController.getGroupStats);

module.exports = router;