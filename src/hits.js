// Hits: does the runner's hitbox touch an obstacle (crash) or a coin (collect)?
// Boxes are compared on three axes: sideways (x), height (y) and along the track (distance).

import { hitbox, laneX } from './player.js';

const RUNNER_DEPTH = 0.6;

// Height range [bottom, top] of each kind of item, above the surface it sits on (item.base).
// A train is solid up to just under its roof: a runner standing on the roof is safe, and so is one
// stepping off the top of a ramp (their front reaches the train a moment before their feet do).
const STEP_UP = 0.5;
const height = (kind, cfg) => ({ low: [0, 0.8], over: [1.0, 3.0], train: [0, cfg.roofHeight - STEP_UP], coin: [0.3, 1.3], highcoin: [2.0, 3.0] })[kind];
// Width of each kind, as a share of the lane (obstacles) or in metres (coins).
const isCoin = (kind) => kind === 'coin' || kind === 'highcoin';
const width = (kind, cfg) => (isCoin(kind) ? 0.6 : 0.8 * cfg.laneWidth);

const overlaps = (a0, a1, b0, b1) => a0 < b1 && b0 < a1;

// prevDistance: where the runner was last frame. An obstacle whose front reached the runner during
// this frame is a head-on hit; one that was already alongside, touched while changing lanes, is a
// side bump (CONTEXT.md). Unknown previous position counts as head-on.
export function checkHits(player, items, distance, cfg, prevDistance = -Infinity) {
  const box = hitbox(player);
  const result = { crash: false, sideBump: false, coins: [] };
  const prevFront = prevDistance + RUNNER_DEPTH / 2;
  const switching = player.switchT < 1;
  for (const item of items) {
    if (item.kind === 'ramp') continue; // a surface to run on, never an obstacle
    const alongTrack = overlaps(distance - RUNNER_DEPTH / 2, distance + RUNNER_DEPTH / 2, item.start, item.end);
    if (!alongTrack) continue;
    const half = width(item.kind, cfg) / 2;
    const itemX = laneX(item.lane, cfg);
    if (!overlaps(player.x - box.width / 2, player.x + box.width / 2, itemX - half, itemX + half)) continue;
    const [bottom, top] = height(item.kind, cfg);
    const base = item.base ?? 0;
    if (!overlaps(player.y, player.y + box.height, base + bottom, base + top)) continue;
    if (isCoin(item.kind)) result.coins.push(item.id);
    else if (switching && item.start < prevFront) result.sideBump = true;
    else result.crash = true;
  }
  return result;
}
