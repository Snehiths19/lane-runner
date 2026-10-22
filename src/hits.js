// Hits: does the runner's hitbox touch an obstacle (crash) or a coin (collect)?
// Boxes are compared on three axes: sideways (x), height (y) and along the track (distance).

import { hitbox, laneX } from './player.js';

const RUNNER_DEPTH = 0.6;

// Height range [bottom, top] of each kind of item.
const HEIGHT = { low: [0, 0.8], over: [1.0, 3.0], train: [0, 4], coin: [0.3, 1.3], highcoin: [2.0, 3.0] };
// Width of each kind, as a share of the lane (obstacles) or in metres (coins).
const isCoin = (kind) => kind === 'coin' || kind === 'highcoin';
const width = (kind, cfg) => (isCoin(kind) ? 0.6 : 0.8 * cfg.laneWidth);

const overlaps = (a0, a1, b0, b1) => a0 < b1 && b0 < a1;

export function checkHits(player, items, distance, cfg) {
  const box = hitbox(player);
  const result = { crash: false, coins: [] };
  for (const item of items) {
    const alongTrack = overlaps(distance - RUNNER_DEPTH / 2, distance + RUNNER_DEPTH / 2, item.start, item.end);
    if (!alongTrack) continue;
    const half = width(item.kind, cfg) / 2;
    const itemX = laneX(item.lane, cfg);
    if (!overlaps(player.x - box.width / 2, player.x + box.width / 2, itemX - half, itemX + half)) continue;
    const [bottom, top] = HEIGHT[item.kind];
    if (!overlaps(player.y, player.y + box.height, bottom, top)) continue;
    if (isCoin(item.kind)) result.coins.push(item.id);
    else result.crash = true;
  }
  return result;
}
