/**
 * game-context.js
 * Single source of truth for game mode detection and context.
 * Replaces scattered career-mode checks throughout the codebase.
 */

/**
 * Check if the current game is in career mode.
 * @returns {boolean} true if career mode, false otherwise
 */
export const isCareerMode = () => location.href.includes('career-mode');

/**
 * Get the current game mode.
 * @returns {'career' | 'region'} The game mode
 */
export const getGameMode = () => isCareerMode() ? 'career' : 'region';

/**
 * Get the region key for the current game.
 * Used for persistence and analytics.
 * @returns {string} Region identifier
 */
export const getRegionKey = () => {
    const url = location.href;
    if (url.includes('career-mode')) return 'career';
    if (url.includes('america')) return 'america';
    if (url.includes('europe')) return 'europe';
    if (url.includes('asia')) return 'asia';
    if (url.includes('africa')) return 'africa';
    if (url.includes('oceania')) return 'oceania';
    return 'global';
};

/**
 * Get full game context for analytics and persistence.
 * @param {number} currentStage - Current stage number
 * @param {number} flagsCount - Number of flags currently displayed
 * @returns {Object} Context object with mode, region, stage, flags_count
 */
export const getContext = (currentStage = 1, flagsCount = 0) => {
    return {
        mode: getGameMode(),
        region: location.href,
        stage: currentStage,
        flags_count: flagsCount
    };
};
