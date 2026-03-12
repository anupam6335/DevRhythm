const User = require('../../models/User');
const Question = require('../../models/Question');
const PatternMastery = require('../../models/PatternMastery');
const ActivityLog = require('../../models/ActivityLog');
const Notification = require('../../models/Notification');
const { invalidateUserCache, invalidateCache } = require('../../middleware/cache');

const handleQuestionMastered = async (job) => {
  const { userId, questionId, progressId, masteredAt = new Date() } = job.data;

  try {
    const question = await Question.findById(questionId);
    if (!question) throw new Error('Question not found');

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // 1. Update PatternMastery
    if (question.pattern) {
      let pattern = await PatternMastery.findOne({ userId, patternName: question.pattern });
      if (!pattern) {
        // Create new pattern mastery record (should not happen if solved first, but handle gracefully)
        pattern = new PatternMastery({ userId, patternName: question.pattern });
      }

      // Increment mastered count
      pattern.masteredCount += 1;

      // Recalculate masteryRate for this pattern (cap at 100)
      const totalPatternQuestions = await Question.countDocuments({ pattern: question.pattern });
      pattern.masteryRate = totalPatternQuestions > 0 
        ? Math.min(100, (pattern.masteredCount / totalPatternQuestions) * 100)
        : 0;

      pattern.lastPracticed = masteredAt;
      pattern.lastUpdated = new Date();

      // Update recentQuestions entry for this question if it exists
      const existingEntry = pattern.recentQuestions.find(
        rq => rq.questionId.toString() === questionId.toString()
      );
      if (existingEntry) {
        existingEntry.status = 'Mastered';
      } else {
        pattern.recentQuestions.unshift({
          questionProgressId: progressId,
          questionId,
          title: question.title,
          problemLink: question.problemLink,
          platform: question.platform,
          difficulty: question.difficulty,
          solvedAt: masteredAt,
          status: 'Mastered',
          timeSpent: 0, // Time spent may not be available here
        });
        if (pattern.recentQuestions.length > 10) pattern.recentQuestions.pop();
      }

      await pattern.save();
      await invalidateCache(`pattern-mastery:*:user:${userId}:*`);
    }

    // 2. Update user stats (overall mastery rate)
    // Recalculate overall mastery rate as average of all pattern mastery rates
    const allPatterns = await PatternMastery.find({ userId });
    let totalMastered = 0;
    let totalMasteryRate = 0;
    allPatterns.forEach(p => {
      totalMastered += p.masteredCount;
      totalMasteryRate += p.masteryRate;
    });
    const avgMasteryRate = allPatterns.length > 0 ? totalMasteryRate / allPatterns.length : 0;
    user.stats.masteryRate = avgMasteryRate;
    await user.save();
    await invalidateUserCache(userId);

    // 3. Create ActivityLog
    await ActivityLog.create({
      userId,
      action: 'question_mastered',
      targetId: questionId,
      targetType: 'Question',
      metadata: {
        title: question.title,
        difficulty: question.difficulty,
        platform: question.platform,
        pattern: question.pattern,
      },
      createdAt: masteredAt,
    });

    // 4. Notification for mastery milestone
    const milestones = [1, 10, 25, 50, 100, 250, 500, 1000];
    if (milestones.includes(totalMastered)) {
      await Notification.create({
        userId,
        type: 'goal_completion',
        title: 'Mastery Milestone!',
        message: `Congratulations! You've mastered ${totalMastered} problems.`,
        data: { milestone: totalMastered },
        channel: 'both',
        status: 'pending',
        scheduledAt: new Date(),
      });
      await invalidateCache(`notifications:${userId}:*`);
    }

    console.log(`Question mastered event processed for user ${userId}`);
  } catch (error) {
    console.error('Error in questionMastered handler:', error);
    throw error;
  }
};

module.exports = { handleQuestionMastered };