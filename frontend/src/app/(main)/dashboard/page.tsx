'use client';

import { useDashboard } from '@/features/dashboard';
import { useUser } from '@/features/user';
import QuestionsList from '@/features/user/components/QuestionsList';
import HeroSummary from './parts/HeroSummary';
import ProductivityHeatmap from './parts/ProductivityHeatmap';
import WeeklyStudyTime from './parts/WeeklyStudyTime';
import GoalsProgressGraph from './parts/GoalsProgressGraph';
import ActiveGoals from './parts/ActiveGoals';
import DailyChallengeCard from './parts/DailyChallengeCard';
import PendingRevisions from './parts/PendingRevisions';
import RecentActivity from './parts/RecentActivity';
import WeakestPatternInsight from './parts/WeakestPatternInsight';
import DashboardSkeleton from './parts/DashboardSkeleton';
import styles from './page.module.css';

export default function DashboardPage() {
  const { data: dashboard, isLoading: dashboardLoading, refetch: refetchDashboard } = useDashboard();
  const { user } = useUser();

  if (dashboardLoading || !dashboard) {
    return <DashboardSkeleton />;
  }

  const {
    summary,
    productivity,
    goals,
    revisions,
    activity,
    dailyChallenge,
    insights,
  } = dashboard;

  return (
    <div className={styles.container}>
      <div className={styles.heroSection}>
        <HeroSummary summary={summary} goals={goals.current} />
      </div>

      <div className={styles.twoColumn}>
        <div className={styles.heatmapColumn}>
          <ProductivityHeatmap data={productivity.currentMonthHeatmap} isLoading={dashboardLoading} />
        </div>
        <div className={styles.weeklyColumn}>
          <WeeklyStudyTime data={productivity.weeklyStudyTime} isLoading={dashboardLoading} />
        </div>
      </div>

      <div className={styles.twoColumn}>
         <div className={styles.pendingColumn}>
          <PendingRevisions
            type="pending"
            revisions={revisions.pendingToday}
            isLoading={dashboardLoading}
            onRevisionComplete={() => refetchDashboard()}
            limit={2}
          />
        </div>
       
         <div className={styles.goalsGraphColumn}>
          <GoalsProgressGraph />
        </div>
      </div>

      <div className={styles.twoColumn}>
        <div className={styles.activeGoalsColumn}>
          <ActiveGoals goals={goals.planned} isLoading={dashboardLoading} />
        </div>
        <div className={styles.dailyChallengeColumn}>
          <DailyChallengeCard dailyChallenge={dailyChallenge} isLoading={dashboardLoading} />
        </div>
      </div>

      <div className={styles.twoColumn}>
         <div className={styles.upcomingColumn}>
          <PendingRevisions
            type="upcoming"
            revisions={revisions.upcoming}
            isLoading={dashboardLoading}
            limit={5}
          />
        </div>
        <div className={styles.recentActivityColumn}>
          <RecentActivity activities={activity.timeline} isLoading={dashboardLoading} />
        </div>
      </div>

      <div className={styles.fullWidth}>
        <QuestionsList isOwnProfile limit={3} />
      </div>

      <div className={styles.fullWidth}>
        <WeakestPatternInsight pattern={insights.weakestPattern} isLoading={dashboardLoading} />
      </div>
    </div>
  );
}