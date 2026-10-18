// Default tuning values. The on-screen panel edits a live copy of these,
// so every number here can be changed while playing.
export const DEFAULTS = {
  runSpeed: 12,         // world units per second
  laneWidth: 2.5,       // distance between lane centres
  laneSwitchTime: 0.12, // seconds to move one lane
  jumpHeight: 2.2,      // peak height of a jump
  gravity: 45,          // higher = snappier jump (same height, less air time)
  slideTime: 0.6,       // seconds a slide lasts
  fastFallSpeed: 30,    // downward speed when swiping down mid-air
};

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
