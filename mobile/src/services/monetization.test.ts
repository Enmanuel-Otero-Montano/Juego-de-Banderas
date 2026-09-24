import { beforeEach, describe, expect, it, vi } from 'vitest';

const nativePlatform = vi.hoisted(() => ({ value: true }));
const purchases = vi.hoisted(() => ({
  configure: vi.fn(),
  getCustomerInfo: vi.fn(),
  logIn: vi.fn(),
  logOut: vi.fn(),
  getOfferings: vi.fn(),
  purchasePackage: vi.fn(),
  restorePurchases: vi.fn(),
}));
const ads = vi.hoisted(() => ({
  initialize: vi.fn(),
  requestConsentInfo: vi.fn(),
  showConsentForm: vi.fn(),
  prepareInterstitial: vi.fn(),
  showInterstitial: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => nativePlatform.value } }));
vi.mock('@revenuecat/purchases-capacitor', () => ({ Purchases: purchases }));
vi.mock('@capacitor-community/admob', () => ({
  AdMob: ads,
  AdmobConsentStatus: { REQUIRED: 'REQUIRED' },
}));

const cacheKey = 'atlas-flags-premium-entitlement-v1';
const activeCustomer = { entitlements: { active: { premium: {} } } };
const inactiveCustomer = { entitlements: { active: {} } };

describe('gracia del entitlement Pro', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_REVENUECAT_ANDROID_KEY', 'test-key');
    vi.stubGlobal('localStorage', new MapStorage());
    nativePlatform.value = true;
    purchases.configure.mockReset();
    purchases.getCustomerInfo.mockReset();
    purchases.logIn.mockReset();
    purchases.logOut.mockReset();
    ads.initialize.mockReset();
    ads.requestConsentInfo.mockReset();
    ads.showConsentForm.mockReset();
    ads.prepareInterstitial.mockReset();
    ads.showInterstitial.mockReset();
    ads.requestConsentInfo.mockResolvedValue({ canRequestAds: true, privacyOptionsRequirementStatus: 'NOT_REQUIRED' });
  });

  it('guarda la hora tras verificar Pro y no inicia anuncios', async () => {
    purchases.getCustomerInfo.mockResolvedValue({ customerInfo: activeCustomer });
    const { monetization } = await import('./monetization');

    await expect(monetization.initialize()).resolves.toBe(true);
    expect(JSON.parse(localStorage.getItem(cacheKey) || '{}')).toMatchObject({ verifiedAt: expect.any(Number) });
    expect(ads.initialize).not.toHaveBeenCalled();
  });

  it('conserva Pro durante una caída temporal dentro de la gracia', async () => {
    localStorage.setItem(cacheKey, JSON.stringify({ verifiedAt: Date.now() - 60_000 }));
    purchases.getCustomerInfo.mockRejectedValue(new Error('offline'));
    const { monetization } = await import('./monetization');

    await expect(monetization.initialize()).resolves.toBe(true);
    expect(ads.initialize).not.toHaveBeenCalled();
  });

  it('no conserva la gracia cuando RevenueCat confirma que no hay entitlement', async () => {
    localStorage.setItem(cacheKey, JSON.stringify({ verifiedAt: Date.now() - 60_000 }));
    purchases.getCustomerInfo.mockResolvedValue({ customerInfo: inactiveCustomer });
    const { monetization } = await import('./monetization');

    await expect(monetization.initialize()).resolves.toBe(false);
    expect(localStorage.getItem(cacheKey)).toBeNull();
    expect(ads.initialize).toHaveBeenCalledTimes(1);
  });

  it('vincula un entitlement promocional a un identificador de cuenta estable', async () => {
    purchases.getCustomerInfo.mockResolvedValue({ customerInfo: inactiveCustomer });
    purchases.logIn.mockResolvedValue({ customerInfo: activeCustomer });
    const { monetization } = await import('./monetization');

    await monetization.initialize();
    await expect(monetization.identifyRankingUser(42)).resolves.toBe(true);
    expect(purchases.logIn).toHaveBeenCalledWith({ appUserID: 'atlasflags-user-42' });
  });
});

describe('regla de intersticiales', () => {
  it('sólo permite cerrar una sesión gratuita múltiplo de tres', async () => {
    const { shouldShowInterstitial } = await import('./monetization');

    expect(shouldShowInterstitial(0, false)).toBe(false);
    expect(shouldShowInterstitial(1, false)).toBe(false);
    expect(shouldShowInterstitial(2, false)).toBe(false);
    expect(shouldShowInterstitial(3, false)).toBe(true);
    expect(shouldShowInterstitial(4, false)).toBe(false);
    expect(shouldShowInterstitial(6, false)).toBe(true);
    expect(shouldShowInterstitial(3, true)).toBe(false);
  });
});

class MapStorage implements Storage {
  private values = new Map<string, string>();

  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}
