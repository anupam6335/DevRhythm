'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FiHome,
  FiTarget,
  FiUsers,
  FiUser,
  FiPlus,
  FiLogOut,
  FiSettings,
  FiShare2,
  FiBookOpen,
  FiChevronDown,
  FiTrendingUp,
  FiMenu,
  FiX,
} from 'react-icons/fi';
import { FaFire } from 'react-icons/fa';
import clsx from 'clsx';

import { ROUTES } from '@/shared/config';
import { useMediaQuery, useClickOutside } from '@/shared/hooks';
import Logo from '@/shared/components/Logo';
import { Avatar } from '@/shared/components/Avatar';
import ThemeToggle from '@/shared/components/ThemeToggle';
import Button from '@/shared/components/Button';
import { useSession } from '@/features/auth/hooks/useSession';

import styles from './Navbar.module.css';

export interface NavbarProps {
  pendingRevisionsCount?: number;
  dailyGoalProgress?: { completed: number; target: number };
  streakCount?: number;
  onQuickAdd: () => void;
  className?: string;
}

type DropdownId = 'questions' | 'progress' | 'groups' | 'profile' | null;

export const Navbar: React.FC<NavbarProps> = ({
  pendingRevisionsCount = 0,
  dailyGoalProgress = { completed: 0, target: 3 },
  streakCount = 0,
  onQuickAdd,
  className,
}) => {
  const { user, logout } = useSession();
  const pathname = usePathname();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [openDropdown, setOpenDropdown] = useState<DropdownId>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const questionsRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const groupsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useClickOutside(questionsRef, () => {
    if (openDropdown === 'questions') setOpenDropdown(null);
  });
  useClickOutside(progressRef, () => {
    if (openDropdown === 'progress') setOpenDropdown(null);
  });
  useClickOutside(groupsRef, () => {
    if (openDropdown === 'groups') setOpenDropdown(null);
  });
  useClickOutside(profileRef, () => {
    if (openDropdown === 'profile') setOpenDropdown(null);
  });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDropdown = (id: DropdownId) => {
    setOpenDropdown((prev) => (prev === id ? null : id));
  };

  const isActive = (href: string) => pathname === href;

  // Desktop navigation
  if (!isMobile) {
    return (
      <nav className={clsx(styles.navbar, scrolled && styles.scrolled, className)}>
        <div className={styles.desktopContainer}>
          <Logo size="sm" layout="horizontal" />

          <div className={styles.navLinks}>
            {/* Questions dropdown */}
            <div className={styles.dropdownWrapper} ref={questionsRef}>
              <Button
                variant="ghost"
                className={clsx(styles.navLink, openDropdown === 'questions' && styles.active)}
                onClick={() => toggleDropdown('questions')}
                aria-expanded={openDropdown === 'questions'}
                aria-haspopup="true"
                leftIcon={<FiBookOpen />}
                rightIcon={<FiChevronDown />}
              >
                Questions
              </Button>
              {openDropdown === 'questions' && (
                <div className={styles.dropdownMenu}>
                  <Link href={ROUTES.QUESTIONS.ROOT} className={styles.dropdownItem}>
                    Browse all questions
                  </Link>
                  <Link href={ROUTES.QUESTIONS.PATTERNS} className={styles.dropdownItem}>
                    Patterns
                  </Link>
                  <Link href={ROUTES.QUESTIONS.TAGS} className={styles.dropdownItem}>
                    Tags
                  </Link>
                </div>
              )}
            </div>

            {/* Progress dropdown */}
            <div className={styles.dropdownWrapper} ref={progressRef}>
              <Button
                variant="ghost"
                className={clsx(styles.navLink, openDropdown === 'progress' && styles.active)}
                onClick={() => toggleDropdown('progress')}
                aria-expanded={openDropdown === 'progress'}
                aria-haspopup="true"
                leftIcon={<FiTrendingUp />}
                rightIcon={<FiChevronDown />}
              >
                Progress
                {pendingRevisionsCount > 0 && (
                  <span className={styles.badge} aria-label={`${pendingRevisionsCount} pending revisions`}>
                    {pendingRevisionsCount > 9 ? '9+' : pendingRevisionsCount}
                  </span>
                )}
              </Button>
              {/* <button
                className={styles.goalPill}
                onClick={onQuickAdd}
                aria-label={`Daily goal: ${dailyGoalProgress.completed}/${dailyGoalProgress.target} solved`}
              >
                <FiTarget className={styles.goalPillIcon} />
                <span>{dailyGoalProgress.completed}/{dailyGoalProgress.target}</span>
              </button> */}
              {openDropdown === 'progress' && (
                <div className={styles.dropdownMenu}>
                  <Link href={ROUTES.PROGRESS} className={styles.dropdownItem}>
                    My progress
                  </Link>
                  <Link href={ROUTES.GOALS.ROOT} className={styles.dropdownItem}>
                    Goals
                  </Link>
                  <Link href={ROUTES.REVISIONS.ROOT} className={styles.dropdownItem}>
                    Revisions
                    {pendingRevisionsCount > 0 && (
                      <span className={styles.badgeInline}>{pendingRevisionsCount}</span>
                    )}
                  </Link>
                </div>
              )}
            </div>

            {/* Groups dropdown */}
            <div className={styles.dropdownWrapper} ref={groupsRef}>
              <Button
                variant="ghost"
                className={clsx(styles.navLink, openDropdown === 'groups' && styles.active)}
                onClick={() => toggleDropdown('groups')}
                aria-expanded={openDropdown === 'groups'}
                aria-haspopup="true"
                leftIcon={<FiUsers />}
                rightIcon={<FiChevronDown />}
              >
                Groups
              </Button>
              {openDropdown === 'groups' && (
                <div className={styles.dropdownMenu}>
                  <Link href={ROUTES.GROUPS.MY} className={styles.dropdownItem}>
                    My groups
                  </Link>
                  <Link href={ROUTES.GROUPS.ROOT} className={styles.dropdownItem}>
                    Discover groups
                  </Link>
                  <Link href={ROUTES.GROUPS.CREATE} className={styles.dropdownItem}>
                    Create group
                  </Link>
                </div>
              )}
            </div>

            <ThemeToggle variant="icon" className={styles.themeToggle} />

            {user ? (
              <div className={styles.dropdownWrapper} ref={profileRef}>
                <Button
                  variant="ghost"
                  className={clsx(styles.avatarButton, openDropdown === 'profile' && styles.active)}
                  onClick={() => toggleDropdown('profile')}
                  aria-expanded={openDropdown === 'profile'}
                  aria-haspopup="true"
                >
                  <Avatar
                    src={user.avatarUrl}
                    name={user.displayName || user.username}
                    size="md"
                  />
                </Button>
                {openDropdown === 'profile' && (
                  <div className={styles.dropdownMenu} style={{ right: 0, left: 'auto' }}>
                    <Link href={ROUTES.PROFILE.ROOT} className={styles.dropdownItem}>
                      <FiUser /> Profile
                    </Link>
                    <Link href={ROUTES.SHARES.ROOT} className={styles.dropdownItem}>
                      <FiShare2 /> Shares
                    </Link>
                    <Link href="/settings" className={styles.dropdownItem}>
                      <FiSettings /> Settings
                    </Link>
                    <div className={styles.dropdownDivider} />
                    <button onClick={logout} className={styles.dropdownItem}>
                      <FiLogOut /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href={ROUTES.LOGIN} className={styles.loginLink}>
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>
    );
  }

  // Mobile navigation
  return (
    <>
      <header className={clsx(styles.mobileHeader, scrolled && styles.scrolled)}>
        <Logo size="sm" layout="horizontal" />
        <Button
          variant="ghost"
          className={styles.hamburgerButton}
          onClick={() => setIsDrawerOpen(true)}
          aria-label="Open menu"
          leftIcon={<FiMenu />}
        />
      </header>

      {isDrawerOpen && (
        <div className={styles.drawerOverlay} onClick={() => setIsDrawerOpen(false)}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              className={styles.drawerClose}
              onClick={() => setIsDrawerOpen(false)}
              aria-label="Close menu"
              leftIcon={<FiX />}
            />

            <div className={styles.drawerContent}>
              <div className={styles.drawerThemeToggle}>
                <span>Theme</span>
                <ThemeToggle variant="both" />
              </div>

              {user ? (
                <div className={styles.drawerUser}>
                  <Avatar src={user.avatarUrl} name={user.displayName || user.username} size="md" />
                  <span className={styles.drawerUserName}>{user.displayName || user.username}</span>
                </div>
              ) : (
                <Link
                  href={ROUTES.LOGIN}
                  className={styles.drawerLoginLink}
                  onClick={() => setIsDrawerOpen(false)}
                >
                  Login
                </Link>
              )}

              <div className={styles.drawerSection}>
                <h3>Questions</h3>
                <Link href={ROUTES.QUESTIONS.ROOT} onClick={() => setIsDrawerOpen(false)}>
                  Browse all questions
                </Link>
                <Link href={ROUTES.QUESTIONS.PATTERNS} onClick={() => setIsDrawerOpen(false)}>
                  Patterns
                </Link>
                <Link href={ROUTES.QUESTIONS.TAGS} onClick={() => setIsDrawerOpen(false)}>
                  Tags
                </Link>
              </div>

              <div className={styles.drawerSection}>
                <h3>Progress</h3>
                <Link href={ROUTES.PROGRESS} onClick={() => setIsDrawerOpen(false)}>
                  My progress
                </Link>
                <Link href={ROUTES.GOALS.ROOT} onClick={() => setIsDrawerOpen(false)}>
                  Goals
                </Link>
                <Link href={ROUTES.REVISIONS.ROOT} onClick={() => setIsDrawerOpen(false)}>
                  Revisions
                  {pendingRevisionsCount > 0 && (
                    <span className={styles.drawerBadge}>{pendingRevisionsCount}</span>
                  )}
                </Link>
              </div>

              <div className={styles.drawerSection}>
                <h3>Groups</h3>
                <Link href={ROUTES.GROUPS.MY} onClick={() => setIsDrawerOpen(false)}>
                  My groups
                </Link>
                <Link href={ROUTES.GROUPS.ROOT} onClick={() => setIsDrawerOpen(false)}>
                  Discover groups
                </Link>
                <Link href={ROUTES.GROUPS.CREATE} onClick={() => setIsDrawerOpen(false)}>
                  Create group
                </Link>
              </div>

              {user && (
                <>
                  <div className={styles.drawerSection}>
                    <h3>Profile</h3>
                    <Link href={ROUTES.PROFILE.ROOT} onClick={() => setIsDrawerOpen(false)}>
                      Profile
                    </Link>
                    <Link href={ROUTES.SHARES.ROOT} onClick={() => setIsDrawerOpen(false)}>
                      Shares
                    </Link>
                    <Link href="/settings" onClick={() => setIsDrawerOpen(false)}>
                      Settings
                    </Link>
                    <Button
                      variant="ghost"
                      className={styles.drawerLogout}
                      onClick={() => {
                        logout();
                        setIsDrawerOpen(false);
                      }}
                      leftIcon={<FiLogOut />}
                    >
                      Logout
                    </Button>
                  </div>

                  {/* {streakCount > 0 && (
                    <div className={styles.drawerStreak}>
                      <FaFire /> {streakCount} day streak
                    </div>
                  )} */}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <nav className={clsx(styles.mobileNavbar, className)}>
        <div className={styles.mobileNavLinks}>
          <Link
            href={ROUTES.DASHBOARD}
            className={clsx(styles.mobileNavItem, isActive(ROUTES.DASHBOARD) && styles.active)}
            aria-label="Dashboard"
          >
            <FiHome className={styles.mobileIcon} />
            <span className={styles.mobileLabel}>Home</span>
          </Link>

          <Link
            href={ROUTES.PROGRESS}
            className={clsx(styles.mobileNavItem, isActive(ROUTES.PROGRESS) && styles.active)}
            aria-label="Progress"
          >
            <FiTrendingUp className={styles.mobileIcon} />
            <span className={styles.mobileLabel}>Progress</span>
            {pendingRevisionsCount > 0 && (
              <span className={styles.mobileBadge}>{pendingRevisionsCount}</span>
            )}
          </Link>

          <button className={styles.quickAddButton} onClick={onQuickAdd} aria-label="Add solved question">
            <FiPlus />
          </button>

          <Link
            href={ROUTES.GROUPS.ROOT}
            className={clsx(styles.mobileNavItem, isActive(ROUTES.GROUPS.ROOT) && styles.active)}
            aria-label="Groups"
          >
            <FiUsers className={styles.mobileIcon} />
            <span className={styles.mobileLabel}>Groups</span>
          </Link>

          <Link
            href={user ? ROUTES.PROFILE.ROOT : ROUTES.LOGIN}
            className={clsx(styles.mobileNavItem, isActive(ROUTES.PROFILE.ROOT) && styles.active)}
            aria-label={user ? 'Profile' : 'Login'}
          >
            {user ? (
              <Avatar src={user.avatarUrl} name={user.displayName || user.username} size="xs" />
            ) : (
              <FiUser className={styles.mobileIcon} />
            )}
            <span className={styles.mobileLabel}>{user ? 'Profile' : 'Login'}</span>
          </Link>
        </div>
      </nav>

      <div className={styles.mobileSpacer} />
    </>
  );
};

export default React.memo(Navbar);