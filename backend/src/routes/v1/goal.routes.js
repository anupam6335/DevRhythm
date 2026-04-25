const express = require("express");
const router = express.Router();
const goalController = require("../../controllers/goal.controller");
const { auth } = require("../../middleware/auth");
const validate = require("../../middleware/validator");
const { cache } = require("../../middleware/cache");
const rateLimiters = require("../../middleware/rateLimiter");
const progressValidator = require("../../utils/validators/progress.validator");
const Joi = require("joi");

// ========== STATIC ROUTES ==========
router.get("/",
  auth,
  rateLimiters.userLimiter,
  cache(30, "goals:list"),
  validate(progressValidator.getGoals, "query"),
  goalController.getGoals
);

router.get("/current",
  auth,
  rateLimiters.userLimiter,
  cache(60, "goals:current"),
  validate(progressValidator.getToday, "query"),
  goalController.getCurrentGoals
);

router.get("/stats",
  auth,
  rateLimiters.userLimiter,
  cache(60, "goals:stats"),
  validate(progressValidator.getStats, "query"),
  goalController.getGoalStats
);

router.get("/history",
  auth,
  rateLimiters.userLimiter,
  cache(300, "goals:history"),
  validate(progressValidator.getHistory, "query"),
  goalController.getGoalHistory
);

// History list (completed/failed)
router.get("/history/list",
  auth,
  rateLimiters.userLimiter,
  validate(Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }), "query"),
  (req, res, next) => {
    req.query.status = 'completed,failed';
    goalController.getGoals(req, res, next);
  }
);

// Planned goals
router.post("/planned",
  auth,
  rateLimiters.progressUpdateLimiter,
  validate(Joi.object({
    questionIds: Joi.array().items(Joi.string().hex().length(24)).min(1).required(),
    timeframe: Joi.string().valid("today", "tomorrow", "nextWeek", "withinMonth"),
    startDate: Joi.date(),
    endDate: Joi.date(),
  }).custom((value, helpers) => {
    if (value.timeframe) {
      if (value.startDate || value.endDate) {
        return helpers.error('any.invalid', { message: 'Cannot provide both timeframe and custom dates' });
      }
      return value;
    }
    if (!value.startDate || !value.endDate) {
      return helpers.error('any.required', { message: 'Either timeframe or both startDate and endDate are required' });
    }
    if (new Date(value.endDate) <= new Date(value.startDate)) {
      return helpers.error('any.invalid', { message: 'endDate must be after startDate' });
    }
    return value;
  }), "body"),
  goalController.createPlannedGoal
);

router.get("/planned",
  auth,
  rateLimiters.userLimiter,
  validate(Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid("active", "completed", "failed"),
  }), "query"),
  goalController.getPlannedGoals
);


router.delete("/planned/:id",
  auth,
  rateLimiters.progressUpdateLimiter,
  validate(Joi.object({ id: Joi.string().hex().length(24).required() }), "params"),
  goalController.deletePlannedGoal
);

// ========== DYNAMIC ROUTES ==========
router.get("/:id",
  auth,
  rateLimiters.userLimiter,
  cache(30, "goal"),
  validate(progressValidator.getGoalById, "params"),
  goalController.getGoalById
);

router.post("/",
  auth,
  rateLimiters.progressUpdateLimiter,
  validate(progressValidator.createGoal, "body"),
  goalController.createGoal
);

router.put("/:id",
  auth,
  rateLimiters.progressUpdateLimiter,
  validate(progressValidator.updateGoal, "body"),
  goalController.updateGoal
);

router.post("/:id/increment",
  auth,
  rateLimiters.progressUpdateLimiter,
  validate(progressValidator.incrementGoal, "body"),
  goalController.incrementGoal
);

router.post("/:id/decrement",
  auth,
  rateLimiters.progressUpdateLimiter,
  validate(progressValidator.decrementGoal, "body"),
  goalController.decrementGoal
);

router.put("/:id/progress",
  auth,
  rateLimiters.progressUpdateLimiter,
  validate(progressValidator.setGoalProgress, "body"),
  goalController.setGoalProgress
);

router.post("/:id/copy",
  auth,
  rateLimiters.progressUpdateLimiter,
  validate(Joi.object({ id: Joi.string().hex().length(24).required() }), "params"),
  validate(Joi.object({
    timeframe: Joi.string().valid("today", "tomorrow", "nextWeek", "withinMonth"),
    startDate: Joi.date(),
    endDate: Joi.date(),
  }).custom((value, helpers) => {
    if (value.timeframe) {
      if (value.startDate || value.endDate) return helpers.error('any.invalid', { message: 'Cannot provide both timeframe and custom dates' });
      return value;
    }
    if (!value.startDate || !value.endDate) {
      return helpers.error('any.required', { message: 'Either timeframe or both startDate and endDate are required' });
    }
    if (new Date(value.endDate) <= new Date(value.startDate)) {
      return helpers.error('any.invalid', { message: 'endDate must be after startDate' });
    }
    return value;
  }), "body"),
  goalController.copyGoal
);

router.post("/auto-create",
  auth,
  rateLimiters.userLimiter,
  validate(progressValidator.autoCreateGoals, "query"),
  goalController.autoCreateGoals
);

router.delete("/:id",
  auth,
  rateLimiters.progressUpdateLimiter,
  validate(progressValidator.deleteGoal, "params"),
  goalController.deleteGoal
);

module.exports = router;