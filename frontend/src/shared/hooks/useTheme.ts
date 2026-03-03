// frontend/src/shared/hooks/useTheme.ts

import { useTheme as useNextTheme } from 'next-themes';
import { useCallback, useMemo } from 'react';

type Theme = 'light' | 'dark' | 'system';

/**
 * Extended theme hook that adds toggle and setter helpers.
 */
export function useTheme() {
  const { theme, setTheme, resolvedTheme, systemTheme, ...rest } = useNextTheme();

  const toggleTheme = useCallback(() => {
    if (resolvedTheme === 'light') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, [resolvedTheme, setTheme]);

  const setLight = useCallback(() => setTheme('light'), [setTheme]);
  const setDark = useCallback(() => setTheme('dark'), [setTheme]);
  const setSystem = useCallback(() => setTheme('system'), [setTheme]);

  const isLight = resolvedTheme === 'light';
  const isDark = resolvedTheme === 'dark';

  return useMemo(
    () => ({
      theme,          // current theme setting (light/dark/system)
      resolvedTheme,  // actual applied theme (light/dark)
      systemTheme,    // system preference (light/dark)
      setTheme,
      toggleTheme,
      setLight,
      setDark,
      setSystem,
      isLight,
      isDark,
      ...rest,
    }),
    [
      theme,
      resolvedTheme,
      systemTheme,
      setTheme,
      toggleTheme,
      setLight,
      setDark,
      setSystem,
      isLight,
      isDark,
      rest,
    ]
  );
}