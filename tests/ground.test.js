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
