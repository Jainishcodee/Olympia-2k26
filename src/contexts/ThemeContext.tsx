import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Theme = 'day' | 'night';

const STORAGE_KEY = 'olympia-theme';

interface ThemeContextValue {
  theme: Theme;
  isDay: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/** Reads the persisted theme before React mounts (used by index.html too). */
function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'night';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'day' || stored === 'night') return stored;
  } catch {
    /* storage unavailable — fall through to default */
  }
  return 'night';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.style.colorScheme = theme === 'day' ? 'light' : 'dark';
  if (theme === 'night') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'day' ? '#FAF6EC' : '#071426');
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const initial = readStoredTheme();
    // Sync the attribute in case index.html did not get there first.
    if (typeof document !== 'undefined') applyTheme(initial);
    return initial;
  });

  useEffect(() => {
    applyTheme(theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore quota / private-mode errors */
    }
  }, [theme]);

  const setTheme = useCallback((next: Theme) => setThemeState(next), []);
  const toggleTheme = useCallback(
    () => setThemeState((current) => (current === 'day' ? 'night' : 'day')),
    [],
  );

  const value = useMemo(
    () => ({ theme, isDay: theme === 'day', setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

export default ThemeProvider;
