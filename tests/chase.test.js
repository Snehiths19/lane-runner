import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createChase, updateChase, bump, startCatch, isStumbling } from '../src/chase.js';
import { RULES } from '../src/rules/index.js';

const rules = RULES.chase;

// Runs the chase forward `seconds` at 60fps.
function step(c, seconds) {
  for (let t = 0; t < seconds - 1e-9; t += 1 / 60) updateChase(c, 1 / 60, rules);
}

test('chasers start close and stay close for startTime', () => {
  const c = createChase(rules);
  assert.equal(c.gap, rules.closeGap);
  step(c, rules.startTime - 0.05);
  assert.equal(c.gap, rules.closeGap);
});

test('chasers drop back to farGap after the start', () => {
  const c = createChase(rules);
  step(c, rules.startTime + 0.5);
  assert.ok(c.gap > rules.closeGap, `gap was ${c.gap}`);
  step(c, 10);
  assert.equal(c.gap, rules.farGap);
});

test('a bump starts a stumble', () => {
  const c = createChase(rules);
  assert.equal(isStumbling(c), false);
  assert.equal(bump(c, rules), 'stumble');
  assert.equal(isStumbling(c), true);
  step(c, rules.stumbleTime - 0.05);
  assert.equal(isStumbling(c), true);
  step(c, 0.1);
  assert.equal(isStumbling(c), false);
});

test('a bump while stumbling is a crash', () => {
  const c = createChase(rules);
  bump(c, rules);
  step(c, 1);
  assert.equal(bump(c, rules), 'crash');
});

test('a bump after the stumble ends is a fresh stumble', () => {
  const c = createChase(rules);
  bump(c, rules);
  step(c, rules.stumbleTime + 0.1);
  assert.equal(bump(c, rules), 'stumble');
});

test('stumbling pulls the chasers back in close', () => {
  const c = createChase(rules);
  step(c, 10);
  assert.equal(c.gap, rules.farGap);
  bump(c, rules);
  step(c, 1);
  assert.equal(c.gap, rules.closeGap);
});

test('catch reaches caughtGap within catchTime, inside the crash pause', () => {
  for (const fps of [30, 60, 144]) {
    const c = createChase(rules);
    step(c, 10);
    startCatch(c);
    for (let t = 0; t < rules.catchTime - 1e-9; t += 1 / fps) updateChase(c, 1 / fps, rules);
    assert.ok(Math.abs(c.gap - rules.caughtGap) < 1e-9, `${fps} fps: gap was ${c.gap}`);
  }
  assert.ok(rules.catchTime < RULES.crash.screenDelay);
});

test('no time passing (paused) changes nothing', () => {
  const c = createChase(rules);
  bump(c, rules);
  const before = { ...c };
  updateChase(c, 0, rules);
  assert.deepEqual(c, before);
});
