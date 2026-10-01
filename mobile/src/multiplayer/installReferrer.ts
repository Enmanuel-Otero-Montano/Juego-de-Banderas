import { Capacitor, registerPlugin } from '@capacitor/core';

interface InstallReferrerPlugin {
  getPendingRaceInvite(): Promise<{ token: string | null }>;
}

const PENDING_INVITE_KEY = 'atlas-flags-pending-race-invite-v1';
const CONSUMED_INVITE_KEY = 'atlas-flags-consumed-race-invite-v1';
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,256}$/;
const installReferrer = registerPlugin<InstallReferrerPlugin>('InstallReferrer');

export const savePendingRaceInvite = (token: string): void => {
  if (!TOKEN_PATTERN.test(token)) return;
  try { localStorage.setItem(PENDING_INVITE_KEY, token); } catch { /* Manual code remains available. */ }
};

export const clearPendingRaceInvite = (consumedToken?: string | null): void => {
  try {
    localStorage.removeItem(PENDING_INVITE_KEY);
    if (consumedToken && TOKEN_PATTERN.test(consumedToken)) localStorage.setItem(CONSUMED_INVITE_KEY, consumedToken);
  } catch { /* No-op. */ }
};

export const readPendingRaceInvite = async (): Promise<string | null> => {
  try {
    const saved = localStorage.getItem(PENDING_INVITE_KEY);
    if (saved && TOKEN_PATTERN.test(saved)) return saved;
    if (!Capacitor.isNativePlatform()) return null;
    const { token } = await installReferrer.getPendingRaceInvite();
    if (!token || !TOKEN_PATTERN.test(token)) return null;
    if (localStorage.getItem(CONSUMED_INVITE_KEY) === token) return null;
    savePendingRaceInvite(token);
    return token;
  } catch {
    return null;
  }
};
