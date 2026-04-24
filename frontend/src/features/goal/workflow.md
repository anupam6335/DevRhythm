┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              USER ACTION                                             │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              ▼                       ▼                       ▼
    ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
    │ Submit code     │     │ Spend time on   │     │ Manually set    │
    │ (runCode)       │     │ question        │     │ status to       │
    │                 │     │ (recordTime     │     │ "Solved"        │
    │                 │     │  Spent)         │     │ (updateProgress)│
    └────────┬────────┘     └────────┬────────┘     └────────┬────────┘
             │                       │                       │
             └───────────────────────┼───────────────────────┘
                                     ▼
                      ┌──────────────────────────────┐
                      │ All test cases passed?       │
                      │ OR totalTimeSpent ≥ 20 min?  │
                      │ OR status manually set?      │
                      └──────────────┬───────────────┘
                                     │ Yes
                                     ▼
                      ┌──────────────────────────────┐
                      │ Queue "question.solved" job  │
                      │ (Bull)                       │
                      └──────────────┬───────────────┘
                                     ▼
          ┌──────────────────────────┼──────────────────────────┐
          │                          │                          │
          ▼                          ▼                          ▼
┌─────────────────┐      ┌─────────────────────┐    ┌─────────────────────┐
│ Update User     │      │ Update Pattern      │    │ Update Heatmap      │
│ Stats:          │      │ Mastery:            │    │ Data:               │
│ - totalSolved++ │      │ - solvedCount++     │    │ - totalActivities++ │
│ - streak update │      │ - totalAttempts++   │    │ - newProblemsSolved │
│ - activeDays++  │      │ - successRate calc  │    │   (first solve)     │
│ - masteryRate   │      │ - confidenceLevel   │    │ - intensityLevel    │
└─────────────────┘      └─────────────────────┘    └─────────────────────┘
          │                          │                          │
          └──────────────────────────┼──────────────────────────┘
                                     ▼
                      ┌──────────────────────────────┐
                      │ First time solving this      │
                      │ question? (isFirstSolve)     │
                      └──────────────┬───────────────┘
                                     │ Yes
                                     ▼
          ┌──────────────────────────┼──────────────────────────┐
          │                          │                          │
          ▼                          ▼                          ▼
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│ Create Revision     │    │ Update Daily Goal   │    │ Update Weekly Goal  │
│ Schedule (if none)  │    │ (active daily goal) │    │ (active weekly goal)│
│ - baseDate = now    │    │ completedCount++    │    │ completedCount++    │
│ - schedule: [1,3,7, │    │ if completedCount   │    │ if completedCount   │
│   14,30] days later │    │ ≥ targetCount →     │    │ ≥ targetCount →     │
│ - auto-complete     │    │ status = completed  │    │ status = completed  │
│   first revision    │    └──────────┬──────────┘    └──────────┬──────────┘
│ - currentRevision   │               │                          │
│   Index = 1         │               └──────────┬───────────────┘
└──────────┬──────────┘                          │
           │                                     ▼
           │                      ┌──────────────────────────────┐
           │                      │ Queue "goal.completed" job   │
           │                      │ → Create in‑app notification │
           │                      │ → Update badges/milestones   │
           │                      └──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     REVISION SYSTEM (ongoing)                    │
└─────────────────────────────────────────────────────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          │                           │                           │
          ▼                           ▼                           ▼
┌─────────────────┐         ┌─────────────────┐        ┌─────────────────┐
│ Daily Cron Job  │         │ User completes  │        │ User spends     │
│ (expiredGoals)  │         │ revision via    │        │ time on revision│
│ marks overdue   │         │ POST /revisions │        │ (same as above) │
│ goals as failed │         │ /:id/complete   │        │ → auto-complete │
└─────────────────┘         └────────┬────────┘        └────────┬────────┘
                                      │                          │
                                      └──────────┬───────────────┘
                                                 ▼
                                  ┌──────────────────────────────┐
                                  │ Queue "revision.completed"   │
                                  │ job                          │
                                  └──────────────┬───────────────┘
                                                 ▼
                                  ┌──────────────────────────────┐
                                  │ Update:                      │
                                  │ - user.stats.totalRevisions++│
                                  │ - question.revisionCount++   │
                                  │ - heatmap.revisionProblems++ │
                                  │ - notification created       │
                                  └──────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    PLANNED GOALS (parallel)                      │
└─────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                      ┌──────────────────────────────┐
                      │ In "question.solved" handler │
                      │ Find active planned goals    │
                      │ where targetQuestions        │
                      │ contains solved questionId   │
                      │ and solvedAt within goal's   │
                      │ startDate/endDate            │
                      └──────────────┬───────────────┘
                                     ▼
                      ┌──────────────────────────────┐
                      │ Add questionId to            │
                      │ goal.completedQuestions      │
                      │ completedCount++             │
                      └──────────────┬───────────────┘
                                     │
                                     ▼
                      ┌──────────────────────────────┐
                      │ If completedCount ≥          │
                      │ targetCount →                │
                      │ status = completed           │
                      │ achievedAt = now             │
                      └──────────────┬───────────────┘
                                     │
                                     ▼
                      ┌──────────────────────────────┐
                      │ Queue "goal.completed" job   │
                      │ (same as daily/weekly)       │
                      └──────────────────────────────┘