const authService = require('./auth.service');
const userService = require('./user.service');
const oauthService = require('./oauth.service');
const onboardingService = require('./onboarding.service');
const questionService = require('./question.service');
const dayService = require('./day.service');
const analyticsService = require('./analytics.service');

module.exports = {
  authService,
  userService,
  oauthService,
  onboardingService,
  questionService,
  dayService,
  analyticsService
};