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
