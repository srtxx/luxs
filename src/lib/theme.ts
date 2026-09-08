import { useSyncExternalStore, useEffect } from 'react';
import type { AppTheme } from '@/components/StudioHeader';

const THEME_KEY = 'luxs_theme';
const DEFAULT_THEME: AppTheme = 'luminous';

const listeners = new Set<() => void>();

function subscribeTheme(callback: () => void) {
  listeners.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_KEY) {
      callback();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', onStorage);
  };
}

function getThemeSnapshot(): AppTheme {
  try {
    const saved = localStorage.getItem(THEME_KEY) as AppTheme | null;
    if (saved === 'luminous' || saved === 'blush' || saved === 'noir') {
      return saved;
    }
  } catch {
    // Ignore storage errors
  }
  return DEFAULT_THEME;
}

function getThemeServerSnapshot(): AppTheme {
  return DEFAULT_THEME;
}

export function useAppTheme(): [AppTheme, (theme: AppTheme) => void] {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setTheme = (newTheme: AppTheme) => {
    try {
      localStorage.setItem(THEME_KEY, newTheme);
    } catch {
      // Ignore storage errors
    }
    document.documentElement.setAttribute('data-theme', newTheme);
    listeners.forEach((callback) => callback());
  };

  return [theme, setTheme];
}
