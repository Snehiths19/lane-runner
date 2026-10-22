import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groundHeightAt } from '../src/ground.js';

const cfg = { laneWidth: 2.5, roofHeight: 3.6 };
const train = { kind: 'train', lane: 2, start: 490, end: 510, base: 0 };
const ramp = { kind: 'ramp', lane: 2, start: 485, end: 490, base: 0 };
const items = [ramp, train];

test('the track is flat away from trains', () => {
  assert.equal(groundHeightAt(0, 500, items, cfg), 0);
  assert.equal(groundHeightAt(2.5, 470, items, cfg), 0);
});

test('a train roof is raised ground', () => {
  assert.equal(groundHeightAt(2.5, 500, items, cfg), 3.6);
});

test('a ramp rises from the track to the roof', () => {
  assert.equal(groundHeightAt(2.5, 485, items, cfg), 0);
  assert.ok(Math.abs(groundHeightAt(2.5, 487.5, items, cfg) - 1.8) < 1e-9);
  assert.equal(groundHeightAt(2.5, 490, items, cfg), 3.6);
});

test('the nearest lane to the runner counts', () => {
  assert.equal(groundHeightAt(1.4, 500, items, cfg), 3.6, 'just past halfway toward the train lane');
  assert.equal(groundHeightAt(1.1, 500, items, cfg), 0, 'still nearer the middle lane');
});

// Big steps happen at high speed or on a slow phone (frames are capped at 0.05 s).
test('running into a train front from the track is not a step up onto the roof', () => {
  const plain = [{ kind: 'train', lane: 1, start: 100, end: 120, base: 0 }];
  assert.equal(groundHeightAt(0, 101, plain, cfg, { y: 0, prevDistance: 99.5 }), 0);
  assert.equal(groundHeightAt(0, 101, plain, cfg, { y: 1.5, prevDistance: 99.5 }), 0, 'mid-jump into the front');
});

test('the top of a ramp still leads onto the roof, even in a big step', () => {
  const y = groundHeightAt(2.5, 489, items, cfg);
  assert.equal(groundHeightAt(2.5, 490.5, items, cfg, { y, prevDistance: 489 }), 3.6);
});

test('a runner on the roof or coming down onto it keeps the roof', () => {
  assert.equal(groundHeightAt(2.5, 500, items, cfg, { y: 3.6, prevDistance: 499 }), 3.6);
  assert.equal(groundHeightAt(2.5, 500, items, cfg, { y: 4.2, prevDistance: 499 }), 3.6);
});

test('swiping sideways into a train alongside is not a step up onto its roof', () => {
  assert.equal(groundHeightAt(1.5, 500, items, cfg, { y: 0, prevDistance: 499 }), 0);
});
