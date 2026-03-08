'use client';

import React, { useState } from 'react';
import Navbar from '@/shared/components/Navbar';
import styles from './page.module.css';

export default function TestPage() {
  const [pendingRevisions, setPendingRevisions] = useState(3);
  const [goalProgress, setGoalProgress] = useState({ completed: 2, target: 3 });
  const [streak, setStreak] = useState(7);
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  // Mock user
  const mockUser = {
    _id: '123',
    username: 'testuser',
    displayName: 'Test User',
    avatarUrl: 'https://via.placeholder.com/40', // placeholder image
  };

  const handleLogout = () => {
    alert('Logout clicked – would redirect');
    setIsLoggedIn(false);
  };

  const handleQuickAdd = () => {
    alert('Quick add clicked – open modal');
  };

  // Some controls to tweak props
  return (
    <div className={styles.container}>
      <h1>Navbar Test Page</h1>
      <p>Resize your browser to see mobile/desktop behaviour. The navbar is sticky/fixed accordingly.</p>

      <div className={styles.controls}>
        <label>
          Pending revisions:
          <input
            type="number"
            value={pendingRevisions}
            onChange={(e) => setPendingRevisions(Number(e.target.value))}
            min={0}
            max={99}
          />
        </label>

        <label>
          Daily goal completed:
          <input
            type="number"
            value={goalProgress.completed}
            onChange={(e) => setGoalProgress({ ...goalProgress, completed: Number(e.target.value) })}
            min={0}
            max={goalProgress.target}
          />
        </label>

        <label>
          Daily goal target:
          <input
            type="number"
            value={goalProgress.target}
            onChange={(e) => setGoalProgress({ ...goalProgress, target: Number(e.target.value) })}
            min={1}
            max={10}
          />
        </label>

        <label>
          Streak count:
          <input
            type="number"
            value={streak}
            onChange={(e) => setStreak(Number(e.target.value))}
            min={0}
            max={999}
          />
        </label>

        <button onClick={() => setIsLoggedIn(!isLoggedIn)}>
          {isLoggedIn ? 'Log out (simulate)' : 'Log in (simulate)'}
        </button>
      </div>

      <Navbar
        user={isLoggedIn ? mockUser : null}
        pendingRevisionsCount={pendingRevisions}
        dailyGoalProgress={goalProgress}
        streakCount={streak}
        onLogout={handleLogout}
        onQuickAdd={handleQuickAdd}
      />

      {/* Spacer to create scrollable area */}
      <div className={styles.content}>
        <p>Scroll down to see the navbar behaviour (desktop sticky, mobile fixed bottom).</p>
        {Array.from({ length: 50 }, (_, i) => (
          <p key={i}>Scrollable content line {i + 1}</p>
        ))}
      </div>
    </div>
  );
}