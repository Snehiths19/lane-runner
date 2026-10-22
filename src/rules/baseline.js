// The baseline: Subway Surfers' rules and numbers, each tagged with its FEATURES.md ID and source.
// Never edit these for taste — put personal changes in tweaks.js. Change a baseline value only
// when better evidence about Subway Surfers turns up, and update FEATURES.md with it.
// 🧪 = placeholder until measured from gameplay.

export const BASELINE = {
  movement: {
    runSpeed: 12,         // MOV-5 🧪 world units per second
    laneWidth: 2.5,       // MOV-1 🧪 distance between lane centres
    laneSwitchTime: 0.12, // MOV-2 🧪 seconds to move one lane
    jumpHeight: 2.2,      // MOV-3 🧪 peak height of a jump
    gravity: 45,          // MOV-3 🧪 higher = snappier jump (same height, less air time)
    slideTime: 0.6,       // MOV-4 🧪 seconds a roll lasts
    fastFallSpeed: 30,    // MOV-4 🧪 downward speed when swiping down mid-air
  },
};
