import { Capacitor, registerPlugin } from '@capacitor/core';

interface SecureSessionPlugin {
  get(): Promise<{ value: string | null }>;
  set(options: { value: string }): Promise<void>;
  remove(): Promise<void>;
}

const SESSION_KEY = 'atlas-flags-ranking-session-v1';
const secureSession = registerPlugin<SecureSessionPlugin>('SecureSession');

export const readSecureSession = async (): Promise<string | null> => {
  if (!Capacitor.isNativePlatform()) return localStorage.getItem(SESSION_KEY);
  const { value } = await secureSession.get();
  return value;
};

export const writeSecureSession = async (value: string): Promise<void> => {
  if (!Capacitor.isNativePlatform()) {
    localStorage.setItem(SESSION_KEY, value);
    return;
  }
  await secureSession.set({ value });
};

export const removeSecureSession = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  await secureSession.remove();
};
