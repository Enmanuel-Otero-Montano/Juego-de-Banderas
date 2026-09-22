import { ENVIRONMENT, ANALYTICS_ENABLED, ANALYTICS_PROVIDER } from './api.js';

let isInitialized = false;

export const initAnalytics = () => {
    if (!ANALYTICS_ENABLED) return;
    isInitialized = true;
    if (ENVIRONMENT === 'development') {
        console.log('[Analytics] Initialized');
    }
};

export const setUser = (userId) => {
    if (!isInitialized || !userId) return;

    // Future implementation for user tracking if providers support it
    if (ENVIRONMENT === 'development') {
        console.debug('[Analytics] setUser:', userId);
    }
};

export const track = (eventName, props = {}) => {
    // 1. Check cookies consent
    const cookiesAccepted = localStorage.getItem('cookiesAccepted') === 'true';
    if (!cookiesAccepted) return;

    // 2. Log in Development
    if (ENVIRONMENT === 'development') {
        console.debug(`[Analytics] ${eventName}`, props);
        return;
    }

    // 3. Track in Production based on Provider
    // Fail-safe: try-catch checking provider existence
    try {
        if (ANALYTICS_PROVIDER === 'ga4') {
            if (typeof window.gtag === 'function') {
                window.gtag('event', eventName, props);
            }
        } else if (ANALYTICS_PROVIDER === 'umami') {
            if (window.umami && typeof window.umami.track === 'function') {
                window.umami.track(eventName, props);
            }
        }
    } catch (e) {
        // Fail silently to avoid breaking the game
        console.error('[Analytics] Error sending event:', e);
    }
};
