const mongoose = require('../src/config/database');
const User = require('../src/models/User');
const Question = require('../src/models/Question');
const UserQuestionProgress = require('../src/models/UserQuestionProgress');
const RevisionSchedule = require('../src/models/RevisionSchedule');
const { getStartOfDay } = require('../src/utils/helpers/date');

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');
    
    // Clear existing data (except real users)
    await Question.deleteMany({});
    console.log('Cleared existing questions');
    
    await UserQuestionProgress.deleteMany({});
    console.log('Cleared existing progress records');
    
    await RevisionSchedule.deleteMany({});
    console.log('Cleared existing revision schedules');
    
    // Your user ID from MongoDB
    const userId = '697efe3dba24d7bc28d1f7aa';
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found. Please make sure you are logged in.');
      process.exit(1);
    }
    
    console.log(`Seeding data for user: ${user.username} (${user.email})`);
    
    // 1. Create 20 dummy questions
    const questions = [
      {
        title: 'Two Sum',
        problemLink: 'https://leetcode.com/problems/two-sum/',
        platform: 'LeetCode',
        platformQuestionId: 'two-sum',
        difficulty: 'Easy',
        tags: ['Array', 'Hash Table'],
        pattern: 'Two Pointers',
        solutionLinks: ['https://www.youtube.com/watch?v=KLlXCFG5TnA'],
        similarQuestions: [],
        contentRef: 'Find two numbers that add up to target'
      },
      {
        title: 'Best Time to Buy and Sell Stock',
        problemLink: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/',
        platform: 'LeetCode',
        platformQuestionId: 'best-time-to-buy-and-sell-stock',
        difficulty: 'Easy',
        tags: ['Array', 'Dynamic Programming'],
        pattern: 'Kadane Variant',
        solutionLinks: ['https://www.youtube.com/watch?v=1pkOgXD63yU'],
        similarQuestions: [],
        contentRef: 'Max profit from stock prices'
      },
      {
        title: 'Valid Parentheses',
        problemLink: 'https://leetcode.com/problems/valid-parentheses/',
        platform: 'LeetCode',
        platformQuestionId: 'valid-parentheses',
        difficulty: 'Easy',
        tags: ['String', 'Stack'],
        pattern: 'Stack',
        solutionLinks: ['https://www.youtube.com/watch?v=WTzjTskDFMg'],
        similarQuestions: [],
        contentRef: 'Check if parentheses are valid'
      },
      {
        title: 'Merge Two Sorted Lists',
        problemLink: 'https://leetcode.com/problems/merge-two-sorted-lists/',
        platform: 'LeetCode',
        platformQuestionId: 'merge-two-sorted-lists',
        difficulty: 'Easy',
        tags: ['Linked List', 'Recursion'],
        pattern: 'Merge Intervals',
        solutionLinks: ['https://www.youtube.com/watch?v=XIdigk956u0'],
        similarQuestions: [],
        contentRef: 'Merge two sorted linked lists'
      },
      {
        title: 'Binary Search',
        problemLink: 'https://leetcode.com/problems/binary-search/',
        platform: 'LeetCode',
        platformQuestionId: 'binary-search',
        difficulty: 'Easy',
        tags: ['Array', 'Binary Search'],
        pattern: 'Binary Search',
        solutionLinks: ['https://www.youtube.com/watch?v=s4DPM8ct1pI'],
        similarQuestions: [],
        contentRef: 'Implement binary search'
      },
      {
        title: 'Maximum Subarray',
        problemLink: 'https://leetcode.com/problems/maximum-subarray/',
        platform: 'LeetCode',
        platformQuestionId: 'maximum-subarray',
        difficulty: 'Medium',
        tags: ['Array', 'Divide and Conquer', 'Dynamic Programming'],
        pattern: 'Kadane Algorithm',
        solutionLinks: ['https://www.youtube.com/watch?v=5WZl3MMT0Eg'],
        similarQuestions: [],
        contentRef: 'Find contiguous subarray with largest sum'
      },
      {
        title: 'Product of Array Except Self',
        problemLink: 'https://leetcode.com/problems/product-of-array-except-self/',
        platform: 'LeetCode',
        platformQuestionId: 'product-of-array-except-self',
        difficulty: 'Medium',
        tags: ['Array', 'Prefix Sum'],
        pattern: 'Prefix Product',
        solutionLinks: ['https://www.youtube.com/watch?v=bNvIQI2wAjk'],
        similarQuestions: [],
        contentRef: 'Product of all elements except self'
      },
      {
        title: '3Sum',
        problemLink: 'https://leetcode.com/problems/3sum/',
        platform: 'LeetCode',
        platformQuestionId: '3sum',
        difficulty: 'Medium',
        tags: ['Array', 'Two Pointers', 'Sorting'],
        pattern: 'Two Pointers',
        solutionLinks: ['https://www.youtube.com/watch?v=jzZsG8n2R9A'],
        similarQuestions: [],
        contentRef: 'Find triplets that sum to zero'
      },
      {
        title: 'Container With Most Water',
        problemLink: 'https://leetcode.com/problems/container-with-most-water/',
        platform: 'LeetCode',
        platformQuestionId: 'container-with-most-water',
        difficulty: 'Medium',
        tags: ['Array', 'Two Pointers', 'Greedy'],
        pattern: 'Two Pointers',
        solutionLinks: ['https://www.youtube.com/watch?v=UuiTKBwPgAo'],
        similarQuestions: [],
        contentRef: 'Max water container area'
      },
      {
        title: 'Merge Intervals',
        problemLink: 'https://leetcode.com/problems/merge-intervals/',
        platform: 'LeetCode',
        platformQuestionId: 'merge-intervals',
        difficulty: 'Medium',
        tags: ['Array', 'Sorting'],
        pattern: 'Merge Intervals',
        solutionLinks: ['https://www.youtube.com/watch?v=44H3cEC2fFM'],
        similarQuestions: [],
        contentRef: 'Merge overlapping intervals'
      },
      {
        title: 'Longest Palindromic Substring',
        problemLink: 'https://leetcode.com/problems/longest-palindromic-substring/',
        platform: 'LeetCode',
        platformQuestionId: 'longest-palindromic-substring',
        difficulty: 'Medium',
        tags: ['String', 'Dynamic Programming'],
        pattern: 'Two Pointers',
        solutionLinks: ['https://www.youtube.com/watch?v=XYQecbcd6_c'],
        similarQuestions: [],
        contentRef: 'Find longest palindrome substring'
      },
      {
        title: 'Climbing Stairs',
        problemLink: 'https://leetcode.com/problems/climbing-stairs/',
        platform: 'LeetCode',
        platformQuestionId: 'climbing-stairs',
        difficulty: 'Easy',
        tags: ['Dynamic Programming', 'Math', 'Memoization'],
        pattern: 'Fibonacci',
        solutionLinks: ['https://www.youtube.com/watch?v=Y0lT9Fck7qI'],
        similarQuestions: [],
        contentRef: 'Ways to climb stairs'
      },
      {
        title: 'Coin Change',
        problemLink: 'https://leetcode.com/problems/coin-change/',
        platform: 'LeetCode',
        platformQuestionId: 'coin-change',
        difficulty: 'Medium',
        tags: ['Array', 'Dynamic Programming', 'Breadth-First Search'],
        pattern: 'DP - Unbounded Knapsack',
        solutionLinks: ['https://www.youtube.com/watch?v=H9bfqozjoqs'],
        similarQuestions: [],
        contentRef: 'Minimum coins to make amount'
      },
      {
        title: 'Word Break',
        problemLink: 'https://leetcode.com/problems/word-break/',
        platform: 'LeetCode',
        platformQuestionId: 'word-break',
        difficulty: 'Medium',
        tags: ['Hash Table', 'String', 'Dynamic Programming', 'Trie', 'Memoization'],
        pattern: 'DP - Partition',
        solutionLinks: ['https://www.youtube.com/watch?v=Sx9NNgInc3A'],
        similarQuestions: [],
        contentRef: 'Check if string can be segmented'
      },
      {
        title: 'Generate Parentheses',
        problemLink: 'https://leetcode.com/problems/generate-parentheses/',
        platform: 'LeetCode',
        platformQuestionId: 'generate-parentheses',
        difficulty: 'Medium',
        tags: ['String', 'Dynamic Programming', 'Backtracking'],
        pattern: 'Backtracking',
        solutionLinks: ['https://www.youtube.com/watch?v=s9fokUqJ76A'],
        similarQuestions: [],
        contentRef: 'Generate valid parentheses combinations'
      },
      {
        title: 'Trapping Rain Water',
        problemLink: 'https://leetcode.com/problems/trapping-rain-water/',
        platform: 'LeetCode',
        platformQuestionId: 'trapping-rain-water',
        difficulty: 'Hard',
        tags: ['Array', 'Two Pointers', 'Dynamic Programming', 'Stack'],
        pattern: 'Two Pointers',
        solutionLinks: ['https://www.youtube.com/watch?v=ZI2z5pq0TqA'],
        similarQuestions: [],
        contentRef: 'Calculate trapped rainwater'
      },
      {
        title: 'Find Median from Data Stream',
        problemLink: 'https://leetcode.com/problems/find-median-from-data-stream/',
        platform: 'LeetCode',
        platformQuestionId: 'find-median-from-data-stream',
        difficulty: 'Hard',
        tags: ['Two Heaps', 'Design', 'Sorting', 'Heap (Priority Queue)'],
        pattern: 'Two Heaps',
        solutionLinks: ['https://www.youtube.com/watch?v=itmhHWaHupI'],
        similarQuestions: [],
        contentRef: 'Find median from streaming data'
      },
      {
        title: 'Longest Increasing Subsequence',
        problemLink: 'https://leetcode.com/problems/longest-increasing-subsequence/',
        platform: 'LeetCode',
        platformQuestionId: 'longest-increasing-subsequence',
        difficulty: 'Medium',
        tags: ['Array', 'Binary Search', 'Dynamic Programming'],
        pattern: 'DP - LIS',
        solutionLinks: ['https://www.youtube.com/watch?v=cjWnW0hdF1Y'],
        similarQuestions: [],
        contentRef: 'Find longest increasing subsequence'
      },
      {
        title: 'House Robber',
        problemLink: 'https://leetcode.com/problems/house-robber/',
        platform: 'LeetCode',
        platformQuestionId: 'house-robber',
        difficulty: 'Medium',
        tags: ['Array', 'Dynamic Programming'],
        pattern: 'DP - 1D',
        solutionLinks: ['https://www.youtube.com/watch?v=73r3KWiEvyk'],
        similarQuestions: [],
        contentRef: 'Maximum loot without adjacent houses'
      },
      {
        title: 'Decode Ways',
        problemLink: 'https://leetcode.com/problems/decode-ways/',
        platform: 'LeetCode',
        platformQuestionId: 'decode-ways',
        difficulty: 'Medium',
        tags: ['String', 'Dynamic Programming'],
        pattern: 'DP - 1D',
        solutionLinks: ['https://www.youtube.com/watch?v=6aEyTjOwlJU'],
        similarQuestions: [],
        contentRef: 'Ways to decode numeric string'
      }
    ];

    const createdQuestions = await Question.insertMany(questions);
    console.log(`Created ${createdQuestions.length} questions`);
    
    // 2. Create progress records for different statuses
    const progressRecords = [
      {
        userId: userId,
        questionId: createdQuestions[0]._id, // Two Sum - Mastered
        status: 'Mastered',
        notes: 'Used hash map for O(n) solution. Need to practice edge cases.',
        keyInsights: 'Trade space for time complexity. HashMap provides O(1) lookups.',
        savedCode: {
          language: 'JavaScript',
          code: 'function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n  return [];\n}'
        },
        attempts: {
          count: 3,
          successful: 2,
          totalTimeSpent: 45
        },
        lastAttemptAt: new Date('2026-01-28T10:30:00Z'),
        lastRevisedAt: new Date('2026-01-31T14:00:00Z'),
        confidenceLevel: 5,
        timeSpent: 120,
        revisionCount: 2
      },
      {
        userId: userId,
        questionId: createdQuestions[1]._id, // Best Time to Buy and Sell Stock - Solved
        status: 'Solved',
        notes: 'Kadane\'s algorithm variant. Track min price and max profit.',
        keyInsights: 'Single pass solution. Update min price and calculate profit.',
        savedCode: {
          language: 'Python',
          code: 'def maxProfit(prices):\n    min_price = float(\'inf\')\n    max_profit = 0\n    for price in prices:\n        min_price = min(min_price, price)\n        max_profit = max(max_profit, price - min_price)\n    return max_profit'
        },
        attempts: {
          count: 2,
          successful: 1,
          totalTimeSpent: 30
        },
        lastAttemptAt: new Date('2026-01-29T15:45:00Z'),
        confidenceLevel: 4,
        timeSpent: 90,
        revisionCount: 1
      },
      {
        userId: userId,
        questionId: createdQuestions[2]._id, // Valid Parentheses - Attempted
        status: 'Attempted',
        notes: 'Stack approach. Need to handle edge cases better.',
        keyInsights: 'Use stack to match parentheses. Check stack empty at end.',
        savedCode: {
          language: 'JavaScript',
          code: 'function isValid(s) {\n  const stack = [];\n  const map = {\n    \')\': \'(\',\n    \']\': \'[\',\n    \'}\': \'{\'\n  };\n  \n  for (let char of s) {\n    if (!map[char]) {\n      stack.push(char);\n    } else if (stack.pop() !== map[char]) {\n      return false;\n    }\n  }\n  return stack.length === 0;\n}'
        },
        attempts: {
          count: 1,
          successful: 0,
          totalTimeSpent: 25
        },
        lastAttemptAt: new Date('2026-01-30T09:15:00Z'),
        confidenceLevel: 3,
        timeSpent: 60
      },
      {
        userId: userId,
        questionId: createdQuestions[3]._id, // Merge Two Sorted Lists - Not Started
        status: 'Not Started',
        confidenceLevel: 1
      },
      {
        userId: userId,
        questionId: createdQuestions[4]._id, // Binary Search - Mastered
        status: 'Mastered',
        notes: 'Standard binary search implementation. Watch for overflow.',
        keyInsights: 'mid = left + (right - left) / 2 to prevent overflow.',
        savedCode: {
          language: 'Java',
          code: 'public int search(int[] nums, int target) {\n    int left = 0, right = nums.length - 1;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (nums[mid] == target) return mid;\n        else if (nums[mid] < target) left = mid + 1;\n        else right = mid - 1;\n    }\n    return -1;\n}'
        },
        attempts: {
          count: 4,
          successful: 3,
          totalTimeSpent: 60
        },
        lastAttemptAt: new Date('2026-01-27T16:30:00Z'),
        lastRevisedAt: new Date('2026-01-30T11:00:00Z'),
        confidenceLevel: 5,
        timeSpent: 180,
        revisionCount: 3
      },
      {
        userId: userId,
        questionId: createdQuestions[5]._id, // Maximum Subarray - Solved
        status: 'Solved',
        notes: 'Kadane\'s algorithm. Reset current sum when negative.',
        keyInsights: 'Global max tracks best result, current sum can be reset.',
        savedCode: {
          language: 'Python',
          code: 'def maxSubArray(nums):\n    max_sum = curr_sum = nums[0]\n    for num in nums[1:]:\n        curr_sum = max(num, curr_sum + num)\n        max_sum = max(max_sum, curr_sum)\n    return max_sum'
        },
        attempts: {
          count: 2,
          successful: 1,
          totalTimeSpent: 35
        },
        lastAttemptAt: new Date('2026-01-28T14:20:00Z'),
        confidenceLevel: 4,
        timeSpent: 75
      },
      {
        userId: userId,
        questionId: createdQuestions[6]._id, // Product of Array Except Self - Attempted
        status: 'Attempted',
        notes: 'Prefix and suffix product approach. Need more practice.',
        keyInsights: 'Compute prefix then suffix products in O(n) time.',
        savedCode: {
          language: 'JavaScript',
          code: 'function productExceptSelf(nums) {\n  const n = nums.length;\n  const result = new Array(n).fill(1);\n  \n  let prefix = 1;\n  for (let i = 0; i < n; i++) {\n    result[i] = prefix;\n    prefix *= nums[i];\n  }\n  \n  let suffix = 1;\n  for (let i = n - 1; i >= 0; i--) {\n    result[i] *= suffix;\n    suffix *= nums[i];\n  }\n  \n  return result;\n}'
        },
        attempts: {
          count: 1,
          successful: 0,
          totalTimeSpent: 40
        },
        lastAttemptAt: new Date('2026-01-29T10:00:00Z'),
        confidenceLevel: 3,
        timeSpent: 85
      },
      {
        userId: userId,
        questionId: createdQuestions[7]._id, // 3Sum - Not Started
        status: 'Not Started',
        confidenceLevel: 1
      }
    ];

    const createdProgress = await UserQuestionProgress.insertMany(progressRecords);
    console.log(`Created ${createdProgress.length} progress records`);
    
    // 3. Create revision schedules for mastered/solved questions (with realistic dates)
    const today = new Date('2026-02-01T07:32:14.925Z'); // Your provided date
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const revisionSchedules = [
      {
        userId: userId,
        questionId: createdQuestions[0]._id, // Two Sum (Mastered)
        schedule: [
          new Date('2026-01-16T00:00:00Z'), // Day 1 (past)
          new Date('2026-01-18T00:00:00Z'), // Day 3 (past)
          new Date('2026-01-22T00:00:00Z'), // Day 7 (past)
          new Date('2026-01-29T00:00:00Z'), // Day 14 (past)
          new Date('2026-02-13T00:00:00Z')  // Day 30 (future)
        ],
        completedRevisions: [
          {
            date: new Date('2026-01-16T00:00:00Z'),
            completedAt: new Date('2026-01-16T10:30:00Z'),
            status: 'completed'
          },
          {
            date: new Date('2026-01-18T00:00:00Z'),
            completedAt: new Date('2026-01-18T14:00:00Z'),
            status: 'completed'
          },
          {
            date: new Date('2026-01-22T00:00:00Z'),
            completedAt: new Date('2026-01-22T09:15:00Z'),
            status: 'completed'
          },
          {
            date: new Date('2026-01-29T00:00:00Z'),
            completedAt: new Date('2026-01-29T16:45:00Z'),
            status: 'completed'
          }
        ],
        currentRevisionIndex: 4, // Next is Day 30
        status: 'active',
        overdueCount: 0,
        baseDate: new Date('2026-01-15T10:30:00Z')
      },
      {
        userId: userId,
        questionId: createdQuestions[1]._id, // Best Time to Buy and Sell Stock (Solved)
        schedule: [
          new Date('2026-01-30T00:00:00Z'), // Day 1 (past - yesterday)
          new Date('2026-02-01T00:00:00Z'), // Day 3 (today - CURRENT DATE)
          new Date('2026-02-05T00:00:00Z'), // Day 7 (future)
          new Date('2026-02-12T00:00:00Z'), // Day 14 (future)
          new Date('2026-02-28T00:00:00Z')  // Day 30 (future)
        ],
        completedRevisions: [
          {
            date: new Date('2026-01-30T00:00:00Z'),
            completedAt: new Date('2026-01-30T15:45:00Z'),
            status: 'completed'
          }
        ],
        currentRevisionIndex: 1, // Today's revision (Day 3)
        status: 'active',
        overdueCount: 0,
        baseDate: new Date('2026-01-29T15:45:00Z')
      },
      {
        userId: userId,
        questionId: createdQuestions[4]._id, // Binary Search (Mastered)
        schedule: [
          new Date('2026-01-28T00:00:00Z'), // Day 1 (past)
          new Date('2026-01-30T00:00:00Z'), // Day 3 (past - 2 days ago)
          new Date('2026-02-03T00:00:00Z'), // Day 7 (future - day after tomorrow)
          new Date('2026-02-10T00:00:00Z'), // Day 14 (future)
          new Date('2026-02-26T00:00:00Z')  // Day 30 (future)
        ],
        completedRevisions: [
          {
            date: new Date('2026-01-28T00:00:00Z'),
            completedAt: new Date('2026-01-28T16:30:00Z'),
            status: 'completed'
          }
        ],
        currentRevisionIndex: 1, // Day 3 was due 2 days ago - OVERDUE
        status: 'overdue',
        overdueCount: 1,
        baseDate: new Date('2026-01-27T16:30:00Z')
      },
      {
        userId: userId,
        questionId: createdQuestions[5]._id, // Maximum Subarray (Solved)
        schedule: [
          new Date('2026-01-29T00:00:00Z'), // Day 1 (past - 3 days ago)
          new Date('2026-01-31T00:00:00Z'), // Day 3 (past - yesterday)
          new Date('2026-02-04T00:00:00Z'), // Day 7 (future - in 3 days)
          new Date('2026-02-11T00:00:00Z'), // Day 14 (future)
          new Date('2026-02-27T00:00:00Z')  // Day 30 (future)
        ],
        completedRevisions: [],
        currentRevisionIndex: 0, // Day 1 was due 3 days ago - OVERDUE
        status: 'overdue',
        overdueCount: 1,
        baseDate: new Date('2026-01-28T14:20:00Z')
      },
      {
        userId: userId,
        questionId: createdQuestions[6]._id, // Product of Array Except Self (Attempted - for testing)
        schedule: [
          tomorrow, // Day 1 (tomorrow)
          new Date(tomorrow.getTime() + 2 * 24 * 60 * 60 * 1000), // Day 3
          new Date(tomorrow.getTime() + 6 * 24 * 60 * 60 * 1000), // Day 7
          new Date(tomorrow.getTime() + 13 * 24 * 60 * 60 * 1000), // Day 14
          new Date(tomorrow.getTime() + 29 * 24 * 60 * 60 * 1000)  // Day 30
        ],
        completedRevisions: [],
        currentRevisionIndex: 0,
        status: 'active',
        overdueCount: 0,
        baseDate: today
      }
    ];

    const createdRevisions = await RevisionSchedule.insertMany(revisionSchedules);
    console.log(`Created ${createdRevisions.length} revision schedules`);
    
    // 4. Update user stats based on progress
    const masteredCount = progressRecords.filter(p => p.status === 'Mastered').length;
    const solvedCount = progressRecords.filter(p => p.status === 'Solved').length;
    const attemptedCount = progressRecords.filter(p => p.status === 'Attempted').length;
    const totalSolved = masteredCount + solvedCount;
    
    // Calculate total time spent
    const totalTimeSpent = progressRecords.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
    
    // Calculate revision count
    const totalRevisions = progressRecords.reduce((sum, p) => sum + (p.revisionCount || 0), 0);
    
    // Update user with calculated stats
    await User.findByIdAndUpdate(userId, {
      $set: {
        'stats.totalSolved': totalSolved,
        'stats.masteryRate': totalSolved > 0 ? Math.round((masteredCount / totalSolved) * 100) : 0,
        'stats.totalRevisions': totalRevisions,
        'stats.totalTimeSpent': totalTimeSpent,
        'stats.activeDays': 7, // Assuming 7 active days
        'streak.current': 3,   // Current 3-day streak
        'streak.longest': 7,   // Longest 7-day streak
        'streak.lastActiveDate': today
      }
    });
    
    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Questions: ${createdQuestions.length}`);
    console.log(`   Progress Records: ${createdProgress.length}`);
    console.log(`   Revision Schedules: ${createdRevisions.length}`);
    console.log('\n🎯 User Stats Updated:');
    console.log(`   Total Solved: ${totalSolved}`);
    console.log(`   Mastered: ${masteredCount}`);
    console.log(`   Solved: ${solvedCount}`);
    console.log(`   Attempted: ${attemptedCount}`);
    console.log(`   Total Time Spent: ${totalTimeSpent} minutes`);
    console.log(`   Current Streak: 3 days`);
    
    console.log('\n🔗 Test these endpoints:');
    console.log('   GET /api/v1/revisions/today      - Should show 1 pending revision (Best Time to Buy and Sell Stock)');
    console.log('   GET /api/v1/revisions/upcoming   - Should show upcoming revisions');
    console.log('   GET /api/v1/revisions/overdue    - Should show 2 overdue revisions');
    console.log('   GET /api/v1/revisions/stats      - Should show revision statistics');
    console.log('   GET /api/v1/progress             - Should show 8 progress records');
    console.log('   GET /api/v1/questions            - Should show 20 questions');
    
    console.log('\n💡 Note: Today\'s date in seed data is: 2026-02-01');
    console.log('   - Revision for "Best Time to Buy and Sell Stock" is due TODAY');
    console.log('   - 2 revisions are OVERDUE');
    console.log('   - 1 revision is scheduled for TOMORROW');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();