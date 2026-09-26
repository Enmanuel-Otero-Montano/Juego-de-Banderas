import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'atlas-flags-backdrop-v1';

export const backdropOptions = ['varied', 'fixed'] as const;
export type BackdropPreference = (typeof backdropOptions)[number];

export const isBackdropPreference = (value: string | null): value is BackdropPreference =>
  value === 'varied' || value === 'fixed';

export const loadBackdropPreference = (): BackdropPreference => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return isBackdropPreference(saved) ? saved : 'fixed';
  } catch {
    return 'fixed';
  }
};

export const saveBackdropPreference = (backdrop: BackdropPreference): void => {
  localStorage.setItem(STORAGE_KEY, backdrop);
};

interface BackdropValue {
  preference: BackdropPreference;
  setPreference: (backdrop: BackdropPreference) => void;
}

const BackdropContext = createContext<BackdropValue | null>(null);

export function BackdropProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<BackdropPreference>(loadBackdropPreference);

  useEffect(() => {
    document.documentElement.dataset.backdrop = preference;
  }, [preference]);

  const setPreference = (next: BackdropPreference) => {
    saveBackdropPreference(next);
    setPreferenceState(next);
  };

  const value = useMemo<BackdropValue>(() => ({ preference, setPreference }), [preference]);
  return <BackdropContext.Provider value={value}>{children}</BackdropContext.Provider>;
}

export const useBackdrop = (): BackdropValue => {
  const value = useContext(BackdropContext);
  if (!value) throw new Error('useBackdrop must be used inside BackdropProvider');
  return value;
};
