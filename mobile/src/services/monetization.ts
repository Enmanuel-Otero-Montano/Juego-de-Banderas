import { Capacitor } from '@capacitor/core';
import { AdMob, AdmobConsentStatus } from '@capacitor-community/admob';
import { Purchases, type PurchasesPackage } from '@revenuecat/purchases-capacitor';

const TEST_REWARDED_ANDROID = 'ca-app-pub-3940256099942544/5224354917';
const TEST_INTERSTITIAL_ANDROID = 'ca-app-pub-3940256099942544/1033173712';
const PRIVACY_OPTIONS_REQUIRED = 'REQUIRED';
const premiumEntitlement = import.meta.env.VITE_REVENUECAT_ENTITLEMENT || 'premium';

let adsReady = false;
let purchasesReady = false;
let privacyOptionsRequired = false;

export const monetization = {
  async initialize(isPremium: boolean): Promise<boolean> {
    // El navegador de desarrollo no constituye una autoridad de compra.
    // En Android, un error al consultar RevenueCat no conserva privilegios
    // premium de una caché local potencialmente obsoleta.
    if (!Capacitor.isNativePlatform()) return false;

    const revenueCatKey = import.meta.env.VITE_REVENUECAT_ANDROID_KEY;
    let verifiedPremium = false;
    if (revenueCatKey) {
      try {
        await Purchases.configure({ apiKey: revenueCatKey });
        const { customerInfo } = await Purchases.getCustomerInfo();
        verifiedPremium = Boolean(customerInfo.entitlements.active[premiumEntitlement]);
        purchasesReady = true;
      } catch (error) {
        purchasesReady = false;
        console.warn('RevenueCat no se pudo iniciar', error);
      }
    }

    isPremium = verifiedPremium;

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
    if (!Capacitor.isNativePlatform() || !adsReady || isPremium || sessionsCompleted % 3 !== 0) return;
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
    return Boolean(customerInfo.entitlements.active[premiumEntitlement]);
  },

  async restorePremium(): Promise<boolean> {
    if (!purchasesReady) return false;
    const { customerInfo } = await Purchases.restorePurchases();
    return Boolean(customerInfo.entitlements.active[premiumEntitlement]);
  },
};
