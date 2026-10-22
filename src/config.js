import { RULES } from './rules/index.js';

// Default slider values: the movement rules (baseline + tweaks). The on-screen panel edits a
// live copy, so every number here can be changed while playing.
export const DEFAULTS = { ...RULES.movement };

// Identifies a set of defaults. Saved slider tweaks are only kept while this matches.
export function defaultsFingerprint(defaults) {
  return JSON.stringify(Object.keys(defaults).sort().map((key) => [key, defaults[key]]));
}

// [min, max, step, label] for each slider in the tuning panel.
export const TUNING_RANGES = {
  runSpeed: [4, 40, 0.5, 'Run speed'],
  laneWidth: [1.5, 4, 0.1, 'Lane width'],
  laneSwitchTime: [0.04, 0.4, 0.01, 'Lane switch time (s)'],
  jumpHeight: [0.5, 5, 0.1, 'Jump height'],
  gravity: [10, 120, 1, 'Gravity'],
  slideTime: [0.2, 1.5, 0.05, 'Slide time (s)'],
  fastFallSpeed: [5, 80, 1, 'Fast-fall speed'],
};
