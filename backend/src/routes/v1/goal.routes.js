const express = require("express");
const router = express.Router();
const goalController = require("../../controllers/goal.controller");
const { auth } = require("../../middleware/auth");
const validate = require("../../middleware/validator");
const { cache } = require("../../middleware/cache");
const rateLimiters = require("../../middleware/rateLimiter");
const progressValidator = require("../../utils/validators/progress.validator");

router.get("/", auth, rateLimiters.userLimiter, cache(30, "goals:list"), validate(progressValidator.getGoals, "query"), goalController.getGoals);
router.get("/current", auth, rateLimiters.userLimiter, cache(60, "goals:current"), validate(progressValidator.getToday, "query"), goalController.getCurrentGoals);
router.get("/stats", auth, rateLimiters.userLimiter, cache(60, "goals:stats"), validate(progressValidator.getStats, "query"), goalController.getGoalStats);
router.get("/history", auth, rateLimiters.userLimiter, cache(300, "goals:history"), validate(progressValidator.getHistory, "query"), goalController.getGoalHistory);
router.get("/:id", auth, rateLimiters.userLimiter, cache(30, "goal"), validate(progressValidator.getGoalById, "params"), goalController.getGoalById);
router.post("/", auth, rateLimiters.userLimiter, validate(progressValidator.createGoal, "body"), goalController.createGoal);
router.put("/:id", auth, rateLimiters.userLimiter, validate(progressValidator.updateGoal, "body"), goalController.updateGoal);
router.post("/:id/increment", auth, rateLimiters.userLimiter, validate(progressValidator.incrementGoal, "body"), goalController.incrementGoal);
router.post("/:id/decrement", auth, rateLimiters.userLimiter, validate(progressValidator.decrementGoal, "body"), goalController.decrementGoal);
router.put("/:id/progress", auth, rateLimiters.userLimiter, validate(progressValidator.setGoalProgress, "body"), goalController.setGoalProgress);
router.post("/auto-create", auth, rateLimiters.userLimiter, validate(progressValidator.autoCreateGoals, "query"), goalController.autoCreateGoals);
router.delete("/:id", auth, rateLimiters.userLimiter, validate(progressValidator.deleteGoal, "params"), goalController.deleteGoal);

module.exports = router;