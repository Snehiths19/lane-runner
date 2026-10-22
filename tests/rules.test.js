import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveRules } from '../src/rules/resolve.js';

const base = () => ({ movement: { runSpeed: 12, laneWidth: 2.5 } });

test('no tweaks gives a copy of the baseline', () => {
  const b = base();
  const r = resolveRules(b, {});
  assert.deepEqual(r, b);
  assert.notEqual(r, b);
  assert.notEqual(r.movement, b.movement);
});

test('a tweak overrides one nested value only', () => {
  const r = resolveRules(base(), { movement: { runSpeed: 20 } });
  assert.equal(r.movement.runSpeed, 20);
  assert.equal(r.movement.laneWidth, 2.5);
});

test('unknown tweak path throws, naming it', () => {
  assert.throws(() => resolveRules(base(), { movement: { runSpeeed: 30 } }), /Unknown tweak: movement\.runSpeeed/);
  assert.throws(() => resolveRules(base(), { moovement: {} }), /Unknown tweak: moovement/);
});

test('wrong tweak type throws', () => {
  assert.throws(() => resolveRules(base(), { movement: { runSpeed: 'fast' } }), /Tweak movement\.runSpeed must be a number/);
  assert.throws(() => resolveRules(base(), { movement: 5 }), /Tweak movement must be a object/);
});

test('result is frozen', () => {
  const r = resolveRules(base(), {});
  assert.throws(() => { r.movement.runSpeed = 1; }, TypeError);
  assert.throws(() => { r.extra = 1; }, TypeError);
});

test('inputs are not mutated', () => {
  const b = base();
  const t = { movement: { runSpeed: 20 } };
  resolveRules(b, t);
  assert.deepEqual(b, base());
  assert.deepEqual(t, { movement: { runSpeed: 20 } });
  assert.equal(Object.isFrozen(b.movement), false);
});

test('shipped tweaks resolve against the baseline', async () => {
  const { BASELINE, RULES } = await import('../src/rules/index.js');
  assert.equal(BASELINE.movement.runSpeed, 12);
  assert.equal(RULES.movement.runSpeed, 20);
});

test('slider defaults come from the rules and match today\'s values', async () => {
  const { DEFAULTS } = await import('../src/config.js');
  const { RULES } = await import('../src/rules/index.js');
  assert.deepEqual(DEFAULTS, {
    runSpeed: 20, laneWidth: 2.5, laneSwitchTime: 0.12, jumpHeight: 2.2,
    gravity: 45, slideTime: 0.6, fastFallSpeed: 30,
  });
  assert.notEqual(DEFAULTS, RULES.movement);
  assert.equal(Object.isFrozen(DEFAULTS), false, 'sliders need a mutable copy');
});
