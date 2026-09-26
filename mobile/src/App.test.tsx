/* @vitest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { I18nProvider } from './i18n';
import { monetization } from './services/monetization';
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

  it('reinicia la partida local y conserva país, preferencias y compra', async () => {
    localStorage.setItem('atlas-flags-profile-v1', JSON.stringify({
      ...initialProfile,
      homeCountryCode: 'uy',
      xp: 400,
      coins: 40,
      streak: 4,
      isPremium: true,
      soundEnabled: false,
      hapticsEnabled: false,
      displayName: 'Capitán',
      rankedProfileReady: true,
      masteredCountries: { uy: 3 },
      journeyProgress: {
        easy: { unlockedStage: 1, completedStages: [] },
        normal: { unlockedStage: 3, completedStages: [1, 2] },
        hard: { unlockedStage: 1, completedStages: [] },
      },
    }));
    localStorage.setItem('atlas-premium-hints-2026-09-25', '2');
    localStorage.setItem('atlas-flags-theme-v1', 'dark');
    localStorage.setItem('atlas-flags-backdrop-v1', 'varied');
    vi.mocked(monetization.initialize).mockResolvedValueOnce(true);

    await act(async () => {
      root.render(<I18nProvider><App /></I18nProvider>);
    });
    await act(async () => {
      await vi.mocked(monetization.initialize).mock.results.at(-1)?.value;
    });
    await act(async () => {
      (container.querySelector('button[aria-label="Ajustes"]') as HTMLButtonElement).click();
    });
    await act(async () => buttonWithText(container, 'Empezar de cero').click());

    const dialog = container.querySelector('.app-dialog') as HTMLElement;
    expect(dialog.textContent).toContain('Se borra la partida de este dispositivo');
    expect(dialog.textContent).toContain('Etapas de Viaje');
    expect(dialog.textContent).toContain('Pasaporte Pro');

    await act(async () => buttonWithText(dialog, 'Empezar de cero').click());

    const saved = JSON.parse(localStorage.getItem('atlas-flags-profile-v1') || '{}') as {
      xp: number;
      coins: number;
      streak: number;
      homeCountryCode: string;
      isPremium: boolean;
      soundEnabled: boolean;
      hapticsEnabled: boolean;
      displayName: string;
      rankedProfileReady: boolean;
      masteredCountries: Record<string, number>;
      journeyProgress: { normal: { completedStages: number[] } };
    };
    expect(saved.xp).toBe(0);
    expect(saved.coins).toBe(initialProfile.coins);
    expect(saved.streak).toBe(0);
    expect(saved.homeCountryCode).toBe('uy');
    expect(saved.isPremium).toBe(true);
    expect(saved.soundEnabled).toBe(false);
    expect(saved.hapticsEnabled).toBe(false);
    expect(saved.displayName).toBe('Capitán');
    expect(saved.rankedProfileReady).toBe(true);
    expect(saved.masteredCountries).toEqual({});
    expect(saved.journeyProgress.normal.completedStages).toEqual([]);
    expect(localStorage.getItem('atlas-premium-hints-2026-09-25')).toBeNull();
    expect(localStorage.getItem('atlas-flags-language-v1')).toBe('es');
    expect(localStorage.getItem('atlas-flags-theme-v1')).toBe('dark');
    expect(localStorage.getItem('atlas-flags-backdrop-v1')).toBe('varied');
    expect(container.textContent).toContain('La partida de este dispositivo volvió a empezar');
  });

  it('al repetir una región perdida empieza una partida nueva', async () => {
    const answerWrong = () => {
      const flagAlt = container.querySelector('.question-flag img')?.getAttribute('alt') || '';
      const word = container.querySelector('.question-word')?.textContent || '';
      const answerName = flagAlt.replace(/^Bandera de /, '') || word;
      const option = [...container.querySelectorAll<HTMLButtonElement>('.answer-option')].find((button) => {
        const label = `${button.textContent || ''} ${button.querySelector('img')?.getAttribute('alt') || ''}`;
        return Boolean(answerName) && !label.includes(answerName);
      });
      if (!option) throw new Error('No se encontró una respuesta incorrecta');
      option.click();
    };

    await act(async () => {
      root.render(<I18nProvider><App /></I18nProvider>);
    });
    await act(async () => buttonWithText(container, 'Por regiones').click());
    await act(async () => buttonWithText(container, 'Oceanía').click());
    expect(container.querySelector('.game-screen')?.getAttribute('data-region')).toBe('Oceania');

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await act(async () => answerWrong());
      if (attempt < 2) await act(async () => buttonWithText(container, 'Continuar').click());
    }
    expect(container.querySelector('.lives')?.getAttribute('aria-label')).toBe('0 vidas');
    await act(async () => buttonWithText(container, 'Ver resultado').click());
    expect(container.textContent).toContain('Repetir');

    await act(async () => buttonWithText(container, 'Repetir').click());

    expect(container.textContent).toContain('1 de 10');
    expect(container.querySelector('.lives')?.getAttribute('aria-label')).toBe('3 vidas');
    expect(container.querySelector('.feedback-card')).toBeNull();
    expect(container.textContent).not.toContain('Ver resultado');
  });

  it('guarda el tema elegido y lo aplica en la página', async () => {
    await act(async () => {
      root.render(<I18nProvider><App /></I18nProvider>);
    });
    await act(async () => {
      (container.querySelector('button[aria-label="Ajustes"]') as HTMLButtonElement).click();
    });
    await act(async () => buttonWithText(container, 'Oscuro').click());
    expect(localStorage.getItem('atlas-flags-theme-v1')).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');

    await act(async () => buttonWithText(container, 'Claro').click());
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('atlas-flags-theme-v1')).toBe('light');
  });

  it('guarda si el fondo de la partida es variado o fijo', async () => {
    await act(async () => {
      root.render(<I18nProvider><App /></I18nProvider>);
    });
    await act(async () => {
      (container.querySelector('button[aria-label="Ajustes"]') as HTMLButtonElement).click();
    });
    expect(document.documentElement.dataset.backdrop).toBe('fixed');
    expect(buttonWithText(container, 'Fijo').className).toContain('active');

    await act(async () => buttonWithText(container, 'Variados').click());
    expect(localStorage.getItem('atlas-flags-backdrop-v1')).toBe('varied');
    expect(document.documentElement.dataset.backdrop).toBe('varied');

    await act(async () => buttonWithText(container, 'Fijo').click());
    expect(localStorage.getItem('atlas-flags-backdrop-v1')).toBe('fixed');
    expect(document.documentElement.dataset.backdrop).toBe('fixed');
  });

  it('cambia la interfaz a francés y lo recuerda', async () => {
    await act(async () => {
      root.render(<I18nProvider><App /></I18nProvider>);
    });
    await act(async () => {
      (container.querySelector('button[aria-label="Ajustes"]') as HTMLButtonElement).click();
    });
    await act(async () => buttonWithText(container, 'FR').click());
    expect(localStorage.getItem('atlas-flags-language-v1')).toBe('fr');
    expect(document.documentElement.lang).toBe('fr');
    expect(container.textContent).toContain('Réglages');
    await act(async () => {
      (container.querySelector('button[aria-label="Retour"]') as HTMLButtonElement).click();
    });
    expect(container.textContent).toContain('Où voyageons-nous aujourd’hui ?');
  });

  it('cambia la interfaz a alemán y lo recuerda', async () => {
    await act(async () => {
      root.render(<I18nProvider><App /></I18nProvider>);
    });
    await act(async () => {
      (container.querySelector('button[aria-label="Ajustes"]') as HTMLButtonElement).click();
    });
    await act(async () => buttonWithText(container, 'DE').click());
    expect(localStorage.getItem('atlas-flags-language-v1')).toBe('de');
    expect(document.documentElement.lang).toBe('de');
    expect(container.textContent).toContain('Einstellungen');
    await act(async () => {
      (container.querySelector('button[aria-label="Zurück"]') as HTMLButtonElement).click();
    });
    expect(container.textContent).toContain('Wohin reisen wir heute?');
  });
});
