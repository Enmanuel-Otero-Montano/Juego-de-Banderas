const SUCCESS_FREQUENCY = 620;
const FAIL_FREQUENCY = 190;
const TONE_SECONDS = 0.18;
const SUCCESS_GAIN = 0.08;
const FAIL_GAIN = 0.1;

export const feedbackTone = (success: boolean) => ({
  frequency: success ? SUCCESS_FREQUENCY : FAIL_FREQUENCY,
  gain: success ? SUCCESS_GAIN : FAIL_GAIN,
  seconds: TONE_SECONDS,
});
