import { Capacitor } from '@capacitor/core';
import { AdMob, AdmobConsentStatus } from '@capacitor-community/admob';
import { Purchases, type PurchasesPackage } from '@revenuecat/purchases-capacitor';

const TEST_REWARDED_ANDROID = 'ca-app-pub-3940256099942544/5224354917';
const TEST_INTERSTITIAL_ANDROID = 'ca-app-pub-3940256099942544/1033173712';
const PRIVACY_OPTIONS_REQUIRED = 'REQUIRED';
const premiumEntitlement = import.meta.env.VITE_REVENUECAT_ENTITLEMENT || 'premium';
const PREMIUM_CACHE_KEY = 'atlas-flags-premium-entitlement-v1';
const PREMIUM_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

let adsReady = false;
let purchasesReady = false;
let privacyOptionsRequired = false;

const activeEntitlement = (customerInfo: { entitlements: { active: Record<string, unknown> } }): boolean =>
  Boolean(customerInfo.entitlements.active[premiumEntitlement]);

const saveEntitlementStatus = (isPremium: boolean): boolean => {
  if (isPremium) rememberVerifiedPremium();
  else forgetVerifiedPremium();
  return isPremium;
};

/** Los anuncios se ofrecen únicamente al cerrar cada tercera sesión completada. */
export const shouldShowInterstitial = (sessionsCompleted: number, isPremium: boolean): boolean =>
  Number.isInteger(sessionsCompleted) && sessionsCompleted > 0 && sessionsCompleted % 3 === 0 && !isPremium;

const rememberVerifiedPremium = () => {
  try {
    localStorage.setItem(PREMIUM_CACHE_KEY, JSON.stringify({ verifiedAt: Date.now() }));
  } catch {
    // La gracia es una mejora de disponibilidad; no debe bloquear la compra.
  }
};

const forgetVerifiedPremium = () => {
  try {
    localStorage.removeItem(PREMIUM_CACHE_KEY);
  } catch {
    // Ignore unavailable storage.
  }
};

const hasPremiumGrace = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(PREMIUM_CACHE_KEY) || 'null') as { verifiedAt?: unknown } | null;
    return typeof saved?.verifiedAt === 'number' && Number.isFinite(saved.verifiedAt) && Date.now() - saved.verifiedAt >= 0 && Date.now() - saved.verifiedAt <= PREMIUM_GRACE_MS;
  } catch {
    return false;
  }
};

export const monetization = {
  async initialize(): Promise<boolean> {
    // El navegador de desarrollo no constituye una autoridad de compra.
    if (!Capacitor.isNativePlatform()) return false;

    const revenueCatKey = import.meta.env.VITE_REVENUECAT_ANDROID_KEY;
    let isPremium = false;
    if (revenueCatKey) {
      try {
        await Purchases.configure({ apiKey: revenueCatKey });
        const { customerInfo } = await Purchases.getCustomerInfo();
        isPremium = saveEntitlementStatus(activeEntitlement(customerInfo));
        purchasesReady = true;
      } catch (error) {
        purchasesReady = false;
        isPremium = hasPremiumGrace();
        console.warn('RevenueCat no se pudo iniciar', error);
      }
    } else {
      isPremium = hasPremiumGrace();
    }

    if (!isPremium) {
      try {
        await AdMob.initialize();
        let consent = await AdMob.requestConsentInfo();
        if (consent.isConsentFormAvailable && consent.status === AdmobConsentStatus.REQUIRED) {
          consent = await AdMob.showConsentForm();
        }
        adsReady = consent.canRequestAds;
        privacyOptionsRequired = consent.privacyOptionsRequirementStatus === PRIVACY_OPTIONS_REQUIRED;
      } catch (error) {
        console.warn('AdMob no se pudo iniciar', error);
      }
    }

    return isPremium;
  },

  requiresPrivacyOptions(): boolean {
    return privacyOptionsRequired;
  },

  /**
   * Vincula RevenueCat a la cuenta autenticada, nunca al alias público. Así una
   * compra (o un entitlement promocional de revisión) se conserva al cambiar
   * de dispositivo y no puede adivinarse a partir del ranking.
   */
  async identifyRankingUser(userId: number): Promise<boolean> {
    if (!Capacitor.isNativePlatform() || !purchasesReady || !Number.isInteger(userId) || userId <= 0) return false;
    try {
      const { customerInfo } = await Purchases.logIn({ appUserID: `atlasflags-user-${userId}` });
      return saveEntitlementStatus(activeEntitlement(customerInfo));
    } catch (error) {
      console.warn('No se pudo vincular la compra con la cuenta de ranking', error);
      return hasPremiumGrace();
    }
  },

  /** Desvincula la cuenta de ranking sin eliminar sus compras de RevenueCat. */
  async clearRankingIdentity(): Promise<boolean> {
    if (!Capacitor.isNativePlatform() || !purchasesReady) return false;
    try {
      const { customerInfo } = await Purchases.logOut();
      return saveEntitlementStatus(activeEntitlement(customerInfo));
    } catch (error) {
      console.warn('No se pudo desvincular la cuenta de ranking', error);
      return false;
    }
  },

  async showPrivacyOptions(): Promise<boolean> {
    if (!Capacitor.isNativePlatform() || !privacyOptionsRequired) return false;
    try {
      await AdMob.showPrivacyOptionsForm();
      const consent = await AdMob.requestConsentInfo();
      adsReady = consent.canRequestAds;
      privacyOptionsRequired = consent.privacyOptionsRequirementStatus === PRIVACY_OPTIONS_REQUIRED;
      return true;
    } catch (error) {
      console.warn('No se pudieron abrir las opciones de privacidad publicitaria', error);
      return false;
    }
  },

  async showRewardedHint(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      return true;
    }
    if (!adsReady) return false;
    try {
      await AdMob.prepareRewardVideoAd({
        adId: import.meta.env.VITE_ADMOB_REWARDED_ID || TEST_REWARDED_ANDROID,
        isTesting: !import.meta.env.VITE_ADMOB_REWARDED_ID,
      });
      await AdMob.showRewardVideoAd();
      return true;
    } catch (error) {
      console.warn('Anuncio recompensado no disponible', error);
      return false;
    }
  },

  async maybeShowInterstitial(sessionsCompleted: number, isPremium: boolean): Promise<void> {
    if (!Capacitor.isNativePlatform() || !adsReady || !shouldShowInterstitial(sessionsCompleted, isPremium)) return;
    try {
      await AdMob.prepareInterstitial({
        adId: import.meta.env.VITE_ADMOB_INTERSTITIAL_ID || TEST_INTERSTITIAL_ANDROID,
        isTesting: !import.meta.env.VITE_ADMOB_INTERSTITIAL_ID,
      });
      await AdMob.showInterstitial();
    } catch (error) {
      console.warn('Intersticial no disponible', error);
    }
  },

  async getPremiumPackage(): Promise<PurchasesPackage | null> {
    if (!purchasesReady) return null;
    const offerings = await Purchases.getOfferings();
    return offerings.current?.lifetime || null;
  },

  async buyPremium(aPackage: PurchasesPackage): Promise<boolean> {
    if (!purchasesReady) return false;
    const { customerInfo } = await Purchases.purchasePackage({ aPackage });
    return saveEntitlementStatus(activeEntitlement(customerInfo));
  },

  async restorePremium(): Promise<boolean> {
    if (!purchasesReady) return false;
    const { customerInfo } = await Purchases.restorePurchases();
    return saveEntitlementStatus(activeEntitlement(customerInfo));
  },
};
