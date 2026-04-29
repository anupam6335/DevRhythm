'use client';

import { createContext, useContext } from 'react';
import type { DailyProblemResponse } from './hooks/useDailyProblem';
import type { GoalStats } from './types/goal.types';

interface CurrentGoalsResponse {
  currentGoals: {
    daily?: any;
    weekly?: any;
  };
  stats: {
    dailyProgress: number;
    dailyTarget: number;
    dailyRemaining: number;
    dailyCompletion: number;
    weeklyProgress: number;
    weeklyTarget: number;
    weeklyRemaining: number;
    weeklyCompletion: number;
  };
}

interface GoalDataContextValue {
  dailyProblem: DailyProblemResponse | null;
  goalStats: GoalStats | null;
  currentGoals: CurrentGoalsResponse | null;
}

const GoalDataContext = createContext<GoalDataContextValue | null>(null);

export function GoalDataProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: GoalDataContextValue;
}) {
  return (
    <GoalDataContext.Provider value={value}>
      {children}
    </GoalDataContext.Provider>
  );
}

export function useGoalData() {
  const ctx = useContext(GoalDataContext);
  if (!ctx) {
    throw new Error('useGoalData must be used within GoalDataProvider');
  }
  return ctx;
}