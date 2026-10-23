import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPowerUps, collect, tickPowerUps, isActive, timeLeft, scoreMultiplier, pullCoins, takeItems } from '../src/powerups.js';
import { RULES } from '../src/rules/index.js';

const rules = RULES.powerUps;

test('a collected power-up runs for its duration, then ends', () => {
  const p = createPowerUps();
  assert.equal(isActive(p, 'magnet'), false);
  collect(p, 'magnet', rules);
  assert.equal(isActive(p, 'magnet'), true);
  tickPowerUps(p, rules.magnet.duration - 0.1);
  assert.equal(isActive(p, 'magnet'), true);
  tickPowerUps(p, 0.2);
  assert.equal(isActive(p, 'magnet'), false);
});

test('picking up a running power-up restarts its timer instead of stacking', () => {
  const p = createPowerUps();
  collect(p, 'double', rules);
  tickPowerUps(p, 4);
  collect(p, 'double', rules);
  assert.equal(timeLeft(p, 'double'), rules.double.duration);
});

test('2X doubles the score multiplier only while it runs', () => {
  const p = createPowerUps();
  assert.equal(scoreMultiplier(p), 1);
  collect(p, 'double', rules);
  assert.equal(scoreMultiplier(p), 2);
  tickPowerUps(p, rules.double.duration + 0.1);
  assert.equal(scoreMultiplier(p), 1);
});

const coin = (id, start, lane = 0, kind = 'coin') => ({ id, kind, lane, start, end: start + 0.6, base: 0 });

test('the magnet pulls coins ahead within range, from any lane, and they arrive after pullTime', () => {
  const items = [coin(1, 105, 0), coin(2, 112, 2, 'highcoin'), coin(3, 100 + rules.magnet.range + 2, 1), coin(4, 90, 1), { id: 5, kind: 'low', lane: 1, start: 104, end: 104.4 }];
  const arrived = [];
  for (let t = 0; t < rules.magnet.pullTime + 1e-9; t += 1 / 60) arrived.push(...pullCoins(items, 100, 1 / 60, rules.magnet));
  assert.deepEqual(arrived.sort(), [1, 2]);
  assert.equal(items.find((i) => i.id === 3).pull, undefined, 'too far ahead');
  assert.equal(items.find((i) => i.id === 4).pull, undefined, 'already behind');
  assert.equal(items.find((i) => i.id === 5).pull, undefined, 'not a coin');
});

test('a coin is counted once even if both the magnet and the runner take it', () => {
  const items = [coin(1, 105), coin(2, 106)];
  assert.equal(takeItems(items, [1, 1, 2]), 2);
  assert.equal(items.length, 0);
  assert.equal(takeItems(items, [1]), 0);
});
