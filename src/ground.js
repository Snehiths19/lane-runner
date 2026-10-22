// Ground height under the runner (CONTEXT.md: ground height comes from one place).
// The track is 0; a train's roof is roofHeight; a ramp rises from 0 to the roof along its length.
// The lane that counts is the one nearest the runner's x, so stepping sideways off a roof drops you.

// How far below a roof the runner's feet may be and still step onto it (hits.js uses it too: a train
// is solid only up to this far under its roof).
export const STEP_UP = 0.5;

// from (optional): the runner's height now and where they were last frame. A roof only counts once
// the runner is up there (on it, landing on it, or arriving from the ramp or roof they stood on);
// running or jumping into a train's front or side never lifts them onto its roof, however big the
// frame's step.
export function groundHeightAt(x, distance, items, cfg, from = null) {
  const { laneWidth, roofHeight } = cfg;
  const lane = Math.round(x / laneWidth) + 1;
  let ramp = 0;
  let roof = 0;
  for (const item of items) {
    if (item.lane !== lane || distance < item.start || distance > item.end) continue;
    if (item.kind === 'train') roof = roofHeight;
    if (item.kind === 'ramp') ramp = Math.max(ramp, roofHeight * (distance - item.start) / (item.end - item.start));
  }
  if (roof && from && from.y < roof - STEP_UP) {
    const before = groundHeightAt(x, from.prevDistance, items, cfg);
    const stoodOnIt = before > 0 && Math.abs(from.y - before) < 0.01;
    if (!stoodOnIt) roof = 0;
  }
  return Math.max(ramp, roof);
}
