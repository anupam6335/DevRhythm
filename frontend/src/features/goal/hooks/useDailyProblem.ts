import { useQuery } from '@tanstack/react-query';
import apiClient from '@/shared/lib/apiClient';

export interface DailyProblemResponse {
  dailyProblem: {
    date: string;
    title: string;
    titleSlug: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    link: string;
    tags: string[];
    codeSnippets?: Record<string, string>;
  };
  todayGoal: {
    targetCount: number;
    completedCount: number;
    completionPercentage: number;
    status: string;
  };
  currentStreak: number;
  longestStreak: number;
}

export function useDailyProblem(initialData?: DailyProblemResponse) {
  return useQuery({
    queryKey: ['daily-problem'],
    queryFn: async (): Promise<DailyProblemResponse> => {
      const response = await apiClient.get<DailyProblemResponse>('/questions/daily');
      return response.data;
    },
    initialData,
    staleTime: 10 * 60 * 1000,
  });
}