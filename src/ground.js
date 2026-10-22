// Ground height under the runner (CONTEXT.md: ground height comes from one place).
// The track is 0; a train's roof is roofHeight; a ramp rises from 0 to the roof along its length.
// The lane that counts is the one nearest the runner's x, so stepping sideways off a roof drops you.

export function groundHeightAt(x, distance, items, { laneWidth, roofHeight }) {
  const lane = Math.round(x / laneWidth) + 1;
  let height = 0;
  for (const item of items) {
    if (item.lane !== lane || distance < item.start || distance > item.end) continue;
    if (item.kind === 'train') height = Math.max(height, roofHeight);
    if (item.kind === 'ramp') height = Math.max(height, roofHeight * (distance - item.start) / (item.end - item.start));
  }
  return height;
}
