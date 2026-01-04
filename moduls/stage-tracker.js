/**
 * stage-tracker.js
 * Manages per-stage tracking data for career mode.
 * Tracks hints used, time elapsed, and group-level accuracy.
 */

/**
 * Stage tracking state
 */
export const stageTracker = {
    stageNumber: 1,
    stageStartTime: 0,
    groups: [],              // Array of { flags_count, correct, had_errors }
    currentGroupErrors: 0    // Errors in current group before success
};

/**
 * Reset stage tracker for a new stage.
 * @param {number} stageNumber - The stage number starting
 */
export const resetStage = (stageNumber) => {
    stageTracker.stageNumber = stageNumber;
    stageTracker.stageStartTime = Date.now();
    stageTracker.groups = [];
    stageTracker.currentGroupErrors = 0;
};

/**
 * Record an error in the current group.
 * Called when a check fails.
 */
export const recordGroupError = () => {
    stageTracker.currentGroupErrors++;
};

/**
 * Record completion of a group (all flags correctly matched).
 * @param {number} flagsCount - Number of flags in this group (1, 2, or 3)
 * @param {number} correctCount - Number correctly matched
 */
export const recordGroupResult = (flagsCount, correctCount) => {
    stageTracker.groups.push({
        flags_count: flagsCount,
        correct: correctCount,
        had_errors: stageTracker.currentGroupErrors > 0
    });
    // Reset error counter for next group
    stageTracker.currentGroupErrors = 0;
};

/**
 * Build the stage completion payload for persistence.
 * @param {number} stageNumber - Current stage number
 * @param {number} scoreAccumulated - Legacy score (ignored in new system but kept for compatibility)
 * @param {number} timeLimit - Original time limit in seconds
 * @param {number} remainingSeconds - Seconds left on timer
 * @param {number} remainingTracks - Hints remaining (0-2)
 * @returns {Object} Stage payload ready for API
 */
export const getStagePayload = (stageNumber, scoreAccumulated, timeLimit, remainingSeconds, remainingTracks) => {
    const hintsUsed = 2 - remainingTracks;
    // time_seconds must be > 0 as per backend requirements
    const secondsUsed = Math.max(1, timeLimit - remainingSeconds);
    const remainingTime = Math.max(0, remainingSeconds);

    // 1. Group Score: Sum of (10 * correct - (had_errors ? 5 : 0))
    const groupScoreTotal = stageTracker.groups.reduce((acc, group) => {
        const groupPoints = (10 * group.correct) - (group.had_errors ? 5 : 0);
        return acc + Math.max(0, groupPoints);
    }, 0);

    // 2. Hint Bonus: (2 - hints_used) * 10
    const hintBonus = (2 - hintsUsed) * 10;

    // 3. Time Bonus: Based on percentages
    let timeBonus = 0;
    if (remainingTime >= Math.ceil(timeLimit * 0.50)) {
        timeBonus = 15;
    } else if (remainingTime >= Math.ceil(timeLimit * 0.25)) {
        timeBonus = 10;
    } else if (remainingTime >= Math.ceil(timeLimit * 0.10)) {
        timeBonus = 5;
    }

    const stageScore = groupScoreTotal + hintBonus + timeBonus;

    return {
        stage_id: String(stageNumber),
        game_mode: 'career',
        score: stageScore,
        time_seconds: secondsUsed,
        hints_used: hintsUsed,
        time_limit: timeLimit,
        groups: stageTracker.groups,
        completed_at: new Date().toISOString()
    };
};

/**
 * Get current stage number.
 * @returns {number} Current stage
 */
export const getCurrentStage = () => stageTracker.stageNumber;
