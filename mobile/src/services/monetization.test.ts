import { beforeEach, describe, expect, it, vi } from 'vitest';

const nativePlatform = vi.hoisted(() => ({ value: true }));
const purchases = vi.hoisted(() => ({
  configure: vi.fn(),
  getCustomerInfo: vi.fn(),
  getOfferings: vi.fn(),
  purchasePackage: vi.fn(),
  restorePurchases: vi.fn(),
}));
const ads = vi.hoisted(() => ({
  initialize: vi.fn(),
  requestConsentInfo: vi.fn(),
  showConsentForm: vi.fn(),
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
    ads.initialize.mockReset();
    ads.requestConsentInfo.mockReset();
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
