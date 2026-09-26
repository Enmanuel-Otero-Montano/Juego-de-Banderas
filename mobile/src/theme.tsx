import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'atlas-flags-theme-v1';
const LIGHT_THEME_COLOR = '#14382f';
const DARK_THEME_COLOR = '#0e1714';

export const themeOptions = ['system', 'light', 'dark'] as const;
export type ThemePreference = (typeof themeOptions)[number];
export type ResolvedTheme = 'light' | 'dark';

export const isThemePreference = (value: string | null): value is ThemePreference =>
  value === 'system' || value === 'light' || value === 'dark';

export const loadThemePreference = (): ThemePreference => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return isThemePreference(saved) ? saved : 'system';
  } catch {
    return 'system';
  }
};

export const saveThemePreference = (theme: ThemePreference): void => {
  localStorage.setItem(STORAGE_KEY, theme);
};

export const readSystemDark = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export const resolveTheme = (preference: ThemePreference, prefersDark: boolean): ResolvedTheme =>
  preference === 'system' ? (prefersDark ? 'dark' : 'light') : preference;

interface ThemeValue {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (theme: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(loadThemePreference);
  const [systemDark, setSystemDark] = useState(readSystemDark);
  const resolved = resolveTheme(preference, systemDark);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystemDark(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);
  }, [resolved]);

  const setPreference = (next: ThemePreference) => {
    saveThemePreference(next);
    setPreferenceState(next);
  };

  const value = useMemo<ThemeValue>(() => ({ preference, resolved, setPreference }), [preference, resolved]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = (): ThemeValue => {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
};
