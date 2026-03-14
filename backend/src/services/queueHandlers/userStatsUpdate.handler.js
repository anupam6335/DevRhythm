const User = require('../../models/User');
const UserStats = require('../../models/UserStats');
const UserQuestionProgress = require('../../models/UserQuestionProgress');
const Question = require('../../models/Question');

/**
 * Recalculate all statistics for a user and store in UserStats collection.
 */
const handleUserStatsUpdate = async (job) => {
  const { userId } = job.data;

  try {
    // Fetch all progress records with question data (using aggregation for performance)
    const stats = await UserQuestionProgress.aggregate([
      { $match: { userId: userId } },
      {
        $lookup: {
          from: 'questions',
          localField: 'questionId',
          foreignField: '_id',
          as: 'question'
        }
      },
      { $unwind: '$question' },
      {
        $group: {
          _id: null,
          totalSolved: {
            $sum: { $cond: [{ $in: ['$status', ['Solved', 'Mastered']] }, 1, 0] }
          },
          totalMastered: {
            $sum: { $cond: [{ $eq: ['$status', 'Mastered'] }, 1, 0] }
          },
          totalAttempts: { $sum: '$attempts.count' },
          totalRevisions: { $sum: '$revisionCount' },
          totalTimeSpent: { $sum: '$totalTimeSpent' },
          easySolved: {
            $sum: {
              $cond: [
                { $and: [{ $in: ['$status', ['Solved', 'Mastered']] }, { $eq: ['$question.difficulty', 'Easy'] }] },
                1,
                0
              ]
            }
          },
          easyMastered: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$status', 'Mastered'] }, { $eq: ['$question.difficulty', 'Easy'] }] },
                1,
                0
              ]
            }
          },
          easyAttempts: {
            $sum: {
              $cond: [{ $eq: ['$question.difficulty', 'Easy'] }, '$attempts.count', 0]
            }
          },
          easyTime: {
            $sum: {
              $cond: [{ $eq: ['$question.difficulty', 'Easy'] }, '$totalTimeSpent', 0]
            }
          },
          mediumSolved: {
            $sum: {
              $cond: [
                { $and: [{ $in: ['$status', ['Solved', 'Mastered']] }, { $eq: ['$question.difficulty', 'Medium'] }] },
                1,
                0
              ]
            }
          },
          mediumMastered: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$status', 'Mastered'] }, { $eq: ['$question.difficulty', 'Medium'] }] },
                1,
                0
              ]
            }
          },
          mediumAttempts: {
            $sum: {
              $cond: [{ $eq: ['$question.difficulty', 'Medium'] }, '$attempts.count', 0]
            }
          },
          mediumTime: {
            $sum: {
              $cond: [{ $eq: ['$question.difficulty', 'Medium'] }, '$totalTimeSpent', 0]
            }
          },
          hardSolved: {
            $sum: {
              $cond: [
                { $and: [{ $in: ['$status', ['Solved', 'Mastered']] }, { $eq: ['$question.difficulty', 'Hard'] }] },
                1,
                0
              ]
            }
          },
          hardMastered: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$status', 'Mastered'] }, { $eq: ['$question.difficulty', 'Hard'] }] },
                1,
                0
              ]
            }
          },
          hardAttempts: {
            $sum: {
              $cond: [{ $eq: ['$question.difficulty', 'Hard'] }, '$attempts.count', 0]
            }
          },
          hardTime: {
            $sum: {
              $cond: [{ $eq: ['$question.difficulty', 'Hard'] }, '$totalTimeSpent', 0]
            }
          },
          leetCodeCount: {
            $sum: {
              $cond: [
                { $and: [{ $in: ['$status', ['Solved', 'Mastered']] }, { $eq: ['$question.platform', 'LeetCode'] }] },
                1,
                0
              ]
            }
          },
          hackerRankCount: {
            $sum: {
              $cond: [
                { $and: [{ $in: ['$status', ['Solved', 'Mastered']] }, { $eq: ['$question.platform', 'HackerRank'] }] },
                1,
                0
              ]
            }
          },
          codeForcesCount: {
            $sum: {
              $cond: [
                { $and: [{ $in: ['$status', ['Solved', 'Mastered']] }, { $eq: ['$question.platform', 'Codeforces'] }] },
                1,
                0
              ]
            }
          },
          otherCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ['$status', ['Solved', 'Mastered']] },
                    // Use $not + $in instead of $nin (which is not an aggregation operator)
                    { $not: { $in: ['$question.platform', ['LeetCode', 'HackerRank', 'Codeforces']] } }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalSolved: 0,
      totalMastered: 0,
      totalAttempts: 0,
      totalRevisions: 0,
      totalTimeSpent: 0,
      easySolved: 0, easyMastered: 0, easyAttempts: 0, easyTime: 0,
      mediumSolved: 0, mediumMastered: 0, mediumAttempts: 0, mediumTime: 0,
      hardSolved: 0, hardMastered: 0, hardAttempts: 0, hardTime: 0,
      leetCodeCount: 0,
      hackerRankCount: 0,
      codeForcesCount: 0,
      otherCount: 0
    };

    const successRate = result.totalAttempts > 0
      ? (result.totalSolved / result.totalAttempts) * 100
      : 0;

    const totalPatterns = await Question.distinct('pattern', { pattern: { $ne: '' } }).countDocuments();
    const masteryRate = totalPatterns > 0
      ? (result.totalMastered / totalPatterns) * 100
      : 0;

    const averageTimePerQuestion = result.totalSolved > 0
      ? result.totalTimeSpent / result.totalSolved
      : 0;

    // Build the stats object in the format expected by the controller
    const userStats = {
      totalSolved: result.totalSolved,
      totalMastered: result.totalMastered,
      totalAttempts: result.totalAttempts,
      totalRevisions: result.totalRevisions,
      totalTimeSpent: result.totalTimeSpent,
      byDifficulty: {
        easy: {
          solved: result.easySolved,
          mastered: result.easyMastered,
          totalTime: result.easyTime
        },
        medium: {
          solved: result.mediumSolved,
          mastered: result.mediumMastered,
          totalTime: result.mediumTime
        },
        hard: {
          solved: result.hardSolved,
          mastered: result.hardMastered,
          totalTime: result.hardTime
        }
      },
      byPlatform: {
        LeetCode: result.leetCodeCount,
        HackerRank: result.hackerRankCount,
        Codeforces: result.codeForcesCount,
        Other: result.otherCount
      },
      successRate,
      masteryRate,
      averageTimePerQuestion,
      lastUpdated: new Date()
    };

    // Upsert into UserStats collection
    await UserStats.findOneAndUpdate(
      { userId },
      { $set: userStats },
      { upsert: true, new: true }
    );

    console.log(`User stats updated for user ${userId}`);
  } catch (error) {
    console.error(`Error updating user stats for ${userId}:`, error);
    throw error;
  }
};

module.exports = { handleUserStatsUpdate };