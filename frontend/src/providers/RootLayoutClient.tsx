'use client';

import React, { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { queryClient } from '@/shared/lib/react-query';
import { ToastProvider } from '@/shared/components/Toast';
import { useMediaQuery } from '@/shared/hooks';
import Navbar from '@/shared/components/Navbar';
import Footer from '@/shared/components/Footer';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { usePendingRevisions } from '@/features/revision/hooks/usePendingRevisions';
import { useCurrentGoalProgress } from '@/features/goal/hooks/useCurrentGoalProgress';
import { AddProgressModal } from '@/features/progress/components/AddProgressModal';

/**
 * Inner component that uses React Query hooks.
 * Must be rendered inside QueryClientProvider.
 */
function LayoutContent({ children }: { children: React.ReactNode }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { user } = useAuth();
  const { pendingCount } = usePendingRevisions();
  const { progress } = useCurrentGoalProgress();
  const isDesktop = useMediaQuery('(min-width: 940px)');

  const handleQuickAdd = () => {
    setIsAddModalOpen(true);
  };

  return (
    <>
      <Navbar
        pendingRevisionsCount={pendingCount}
        dailyGoalProgress={progress}
        streakCount={user?.streak?.current || 0}
        onQuickAdd={handleQuickAdd}
      />
      <main className="devRhythmContainer">{children}</main>
      {isDesktop && <Footer />}
      <AddProgressModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </>
  );
}

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <ToastProvider position="top-center">
          <LayoutContent>{children}</LayoutContent>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}