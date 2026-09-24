/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { I18nProvider } from './i18n';
import { initialProfile } from './storage';

const apiMocks = vi.hoisted(() => ({
  clearRankingSession: vi.fn(),
  flushPendingRanking: vi.fn(),
  loadRankingSession: vi.fn(),
  requestPasswordReset: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => false },
}));

vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn(),
    exitApp: vi.fn(),
  },
}));

vi.mock('@capacitor/haptics', () => ({
  Haptics: { notification: vi.fn() },
  NotificationType: { Success: 'success', Error: 'error' },
}));

vi.mock('./services/monetization', () => ({
  monetization: {
    initialize: vi.fn().mockResolvedValue(false),
    identifyRankingUser: vi.fn().mockResolvedValue(false),
    clearRankingIdentity: vi.fn().mockResolvedValue(false),
    requiresPrivacyOptions: vi.fn().mockReturnValue(false),
    showPrivacyOptions: vi.fn().mockResolvedValue(false),
    showRewardedHint: vi.fn().mockResolvedValue(true),
    maybeShowInterstitial: vi.fn().mockResolvedValue(undefined),
    getPremiumPackage: vi.fn().mockResolvedValue(null),
    buyPremium: vi.fn().mockResolvedValue(false),
    restorePremium: vi.fn().mockResolvedValue(false),
  },
}));

vi.mock('./services/api', () => {
  class ApiError extends Error {
    status?: number;
    email?: string;
  }
  return {
    ApiError,
    beginCareerAttempt: vi.fn(),
    clearRankingSession: apiMocks.clearRankingSession,
    completePendingRankingAttempt: vi.fn(),
    deleteRankingAccount: vi.fn(),
    flushPendingRanking: apiMocks.flushPendingRanking,
    getCareerHistory: vi.fn(),
    getLeaderboard: vi.fn(),
    loadRankingSession: apiMocks.loadRankingSession,
    loginRankingAccount: vi.fn(),
    queueCareerSelection: vi.fn(),
    RANKING_SESSION_EXPIRED_EVENT: 'atlas-flags-ranking-session-expired',
    registerRankingAccount: vi.fn(),
    requestPasswordReset: apiMocks.requestPasswordReset,
    resendVerificationEmail: vi.fn(),
    startPendingRankingAttempt: vi.fn(),
    updateRankingProfile: vi.fn(),
  };
});

const buttonWithText = (container: HTMLElement, text: string): HTMLButtonElement => {
  const button = [...container.querySelectorAll('button')].find((element) => element.textContent?.includes(text));
  if (!button) throw new Error(`No se encontró el botón: ${text}`);
  return button as HTMLButtonElement;
};

describe('App', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('atlas-flags-welcomed', '1');
    localStorage.setItem('atlas-flags-language-v1', 'es');
    localStorage.setItem('atlas-flags-profile-v1', JSON.stringify({ ...initialProfile, homeCountryCode: 'uy' }));
    apiMocks.requestPasswordReset.mockReset();
    apiMocks.requestPasswordReset.mockResolvedValue(undefined);
    apiMocks.clearRankingSession.mockReset();
    apiMocks.flushPendingRanking.mockReset();
    apiMocks.flushPendingRanking.mockResolvedValue(false);
    apiMocks.loadRankingSession.mockReset();
    apiMocks.loadRankingSession.mockResolvedValue(null);
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  it('allows a local player to request a password recovery link from settings', async () => {
    await act(async () => {
      root.render(<I18nProvider><App /></I18nProvider>);
    });
    expect(container.textContent).toContain('¿A dónde viajamos hoy?');

    await act(async () => {
      (container.querySelector('button[aria-label="Ajustes"]') as HTMLButtonElement).click();
    });
    await act(async () => buttonWithText(container, 'Cuenta de clasificación').click());
    expect(container.textContent).toContain('Tu cuenta de clasificación');

    await act(async () => buttonWithText(container, 'Olvidé mi contraseña').click());
    const email = container.querySelector('input[type="email"]') as HTMLInputElement;
    expect(email).not.toBeNull();

    await act(async () => {
      const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      valueSetter?.call(email, 'explorador@example.com');
      email.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => {
      (container.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });

    expect(apiMocks.requestPasswordReset).toHaveBeenCalledWith('explorador@example.com');
    expect(container.textContent).toContain('Si existe una cuenta con ese correo, enviamos un enlace para restablecer la contraseña.');
  });

  it('informs the player when an authenticated ranking session expires', async () => {
    apiMocks.loadRankingSession.mockResolvedValue({ accessToken: 'expired-token', refreshToken: 'refresh-token', username: 'atlas' });
    await act(async () => {
      root.render(<I18nProvider><App /></I18nProvider>);
    });

    await act(async () => {
      globalThis.dispatchEvent(new Event('atlas-flags-ranking-session-expired'));
    });

    expect(apiMocks.clearRankingSession).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain('Tu sesión de clasificación venció. Inicia sesión de nuevo para publicar resultados.');
  });
});
