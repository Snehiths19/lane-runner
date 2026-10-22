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
    gravity: 36,          // MOV-3 air time ≈ 0.7 s measured 2026-10-22 (higher = snappier, same height)
    slideTime: 0.6,       // MOV-4 🧪 seconds a roll lasts
    fastFallSpeed: 30,    // MOV-4 🧪 downward speed when swiping down mid-air
  },
  track: {
    rowLength: 5,         // TRK-1 metres per section-map line (our call)
    startClear: 36,       // CHS-2 empty track at run start until the intro leap exists (our call)
    roofHeight: 3.6,      // TRK-5 🧪 train roof height; above jump reach so only ramps get you up (our call)
  },
  scoring: {
    pointsPerMetre: 14.6 / 12, // SCO-1 ≈14.6 points/s at x1 measured 2026-10-22, ÷ baseline run speed
  },
  crash: {
    screenDelay: 1.0,     // RUN-1 🧪 seconds from crash to crash screen
  },
  chase: {
    stumbleTime: 3,       // HIT-3 🧪 seconds a stumble lasts (second bump inside it = crash)
    startTime: 2,         // CHS-1 🧪 seconds the chasers stay close at run start
    closeGap: 2.0,        // CHS-1 metres behind the runner when close (our call, in view on PC and phone)
    farGap: 8,            // CHS-1 metres behind when dropped back (our call, out of view)
    closeSpeed: 8,        // CHS-1 metres per second the gap closes (our call)
    dropSpeed: 3,         // CHS-1 metres per second the gap opens (our call)
    caughtGap: 0.4,       // CHS-1 metres behind the runner once caught (our call)
    catchTime: 0.5,       // CHS-1 seconds to run up and grab after a crash (our call, < screenDelay)
  },
};
