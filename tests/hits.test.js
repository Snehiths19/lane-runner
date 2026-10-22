import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS } from '../src/config.js';
import { createPlayer, handleAction } from '../src/player.js';
import { checkHits } from '../src/hits.js';

const cfg = { ...DEFAULTS };
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
  assert.deepEqual(checkHits(p, [coin], 100, cfg), { crash: false, coins: [coin.id] });
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
