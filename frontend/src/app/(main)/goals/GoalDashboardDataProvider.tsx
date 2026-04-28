import { cookies } from 'next/headers';
import { GoalDataProvider } from '@/features/goal/GoalDataContext';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

async function fetchWithToken(endpoint: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return null;
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data;
}

export default async function GoalDashboardDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dailyProblem, goalStats, currentGoals] = await Promise.all([
    fetchWithToken('/questions/daily'),
    fetchWithToken('/goals/stats'),
    fetchWithToken('/goals/current'),
  ]);

  return (
    <GoalDataProvider
      value={{
        dailyProblem: dailyProblem || null,
        goalStats: goalStats?.stats || null,
        currentGoals: currentGoals || null,
      }}
    >
      {children}
    </GoalDataProvider>
  );
}