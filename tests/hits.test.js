import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS } from '../src/config.js';
import { createPlayer, handleAction } from '../src/player.js';
import { checkHits } from '../src/hits.js';

const cfg = { ...DEFAULTS, roofHeight: 3.6 };
let id = 0;
// An item right where the runner is (distance 100), in the given lane.
const at = (kind, lane = 1, depth = kind === 'train' ? 10 : 0.4) =>
  ({ id: ++id, kind, lane, start: 100 - depth / 2, end: 100 + depth / 2 });

test('running into a low barrier crashes', () => {
  const p = createPlayer();
  assert.equal(checkHits(p, [at('low')], 100, cfg).crash, true);
});

test('jumping over a low barrier is safe', () => {
  const p = createPlayer();
  handleAction(p, 'jump', cfg);
  p.y = 1.0;
  assert.equal(checkHits(p, [at('low')], 100, cfg).crash, false);
});

test('an obstacle in another lane is ignored', () => {
  const p = createPlayer();
  assert.equal(checkHits(p, [at('low', 0), at('train', 2)], 100, cfg).crash, false);
});

test('standing into an overhead bar crashes; rolling under it is safe', () => {
  const p = createPlayer();
  assert.equal(checkHits(p, [at('over')], 100, cfg).crash, true);
  handleAction(p, 'slide', cfg);
  assert.equal(checkHits(p, [at('over')], 100, cfg).crash, false);
});

test('a train crashes even at the top of a jump', () => {
  const p = createPlayer();
  handleAction(p, 'jump', cfg);
  p.y = cfg.jumpHeight;
  assert.equal(checkHits(p, [at('train')], 100, cfg).crash, true);
});

test('a coin in the lane is collected, not a crash', () => {
  const p = createPlayer();
  const coin = at('coin', 1, 0.6);
  assert.deepEqual(checkHits(p, [coin], 100, cfg), { crash: false, sideBump: false, coins: [coin.id], powerUps: [] });
});

test('a high coin needs a jump', () => {
  const p = createPlayer();
  const coin = at('highcoin', 1, 0.6);
  assert.deepEqual(checkHits(p, [coin], 100, cfg).coins, []);
  handleAction(p, 'jump', cfg);
  p.y = 1.5;
  assert.deepEqual(checkHits(p, [coin], 100, cfg).coins, [coin.id]);
});

test('a coin counts once once the caller removes it', () => {
  const p = createPlayer();
  const items = [at('coin', 1, 0.6)];
  let total = 0;
  for (let frame = 0; frame < 3; frame++) {
    const { coins } = checkHits(p, items, 100, cfg);
    total += coins.length;
    for (const cid of coins) items.splice(items.findIndex((i) => i.id === cid), 1);
  }
  assert.equal(total, 1);
});

test('on the roof, the train underneath is safe', () => {
  const p = createPlayer();
  p.y = 3.6;
  assert.equal(checkHits(p, [at('train')], 100, cfg).crash, false);
});

test('ramps are surfaces, never obstacles', () => {
  const p = createPlayer();
  assert.equal(checkHits(p, [at('ramp', 1, 5)], 100, cfg).crash, false);
});

test('a roof coin is collected only on the roof', () => {
  const p = createPlayer();
  const coin = { ...at('coin', 1, 0.6), base: 3.6 };
  assert.deepEqual(checkHits(p, [coin], 100, cfg).coins, []);
  p.y = 3.6;
  assert.deepEqual(checkHits(p, [coin], 100, cfg).coins, [coin.id]);
});

test('switching into a train already alongside is a side bump, not a crash', () => {
  const p = createPlayer();
  handleAction(p, 'right', cfg);
  p.x = 1.6; // most of the way into the right lane
  const train = at('train', 2, 20); // runs from 90 to 110: already beside the runner
  const hit = checkHits(p, [train], 100, cfg, 99.7);
  assert.equal(hit.crash, false);
  assert.equal(hit.sideBump, true);
});

test('a train front reaching the runner is a head-on crash, even at high speed', () => {
  const p = createPlayer();
  const train = { ...at('train', 1, 20), start: 99.9, end: 119.9 };
  assert.deepEqual(checkHits(p, [train], 100, cfg, 99.6), { crash: true, sideBump: false, coins: [], powerUps: [] });
  // A 2 m step (very high speed) that jumps past the front still counts as head-on.
  const deep = { ...train, start: 98.5, end: 118.5 };
  assert.equal(checkHits(p, [deep], 100, cfg, 98).crash, true);
});

test('hopping from roof to roof is safe', () => {
  const p = createPlayer();
  p.y = 3.6;
  handleAction(p, 'right', cfg);
  p.x = 1.25; // halfway between the two roofs
  const trains = [at('train', 1, 20), at('train', 2, 20)];
  assert.deepEqual(checkHits(p, trains, 100, cfg, 99.7), { crash: false, sideBump: false, coins: [], powerUps: [] });
});

test('touching something alongside without changing lanes is a crash, not a bounce', () => {
  const p = createPlayer(); // not switching lanes
  const barrier = at('low', 1, 0.4);
  assert.equal(checkHits(p, [barrier], 100, cfg, 99.9).crash, true);
});

test('running off the top of a ramp onto the roof is not a crash', () => {
  const p = createPlayer();
  p.y = 3.38; // last bit of the ramp, runner's front already at the train's front
  const train = { ...at('train', 1, 20), start: 100.2, end: 120.2 };
  assert.equal(checkHits(p, [train], 100, cfg, 99.8).crash, false);
});

test('moving train front arriving this frame is head-on even mid-switch', () => {
  const p = createPlayer();
  handleAction(p, 'right', cfg);
  p.x = 1.6;
  // Last frame its front was 1 m ahead of the runner; this frame it reached them.
  const train = { id: ++id, kind: 'train', lane: 2, start: 99.8, end: 109.8, prevStart: 101, speed: 10 };
  assert.deepEqual(checkHits(p, [train], 100, cfg, 99.7), { crash: true, sideBump: false, coins: [], powerUps: [] });
});

test('touching a power-up reports it, like a coin', () => {
  const p = createPlayer();
  const up = { id: ++id, kind: 'powerup', power: 'magnet', lane: 1, start: 99.7, end: 100.3, base: 0 };
  assert.deepEqual(checkHits(p, [up], 100, cfg), { crash: false, sideBump: false, coins: [], powerUps: [up.id] });
});
