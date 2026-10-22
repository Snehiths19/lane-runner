import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recordRun, loadRuns } from '../src/runs.js';
import { STORAGE_KEY as TUNING_KEY } from '../src/tuning.js';

function fakeStorage() {
  const map = new Map();
  return { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), map };
}

test('the first run is a new best', () => {
  const storage = fakeStorage();
  assert.deepEqual(recordRun(storage, 500), { best: 500, top: [500], newBest: true });
});

test('keeps the top five, highest first, and knows when a run beats the best', () => {
  const storage = fakeStorage();
  for (const s of [300, 900, 100, 500, 700, 200]) recordRun(storage, s);
  assert.deepEqual(loadRuns(storage).top, [900, 700, 500, 300, 200]);
  assert.equal(recordRun(storage, 800).newBest, false);
  assert.deepEqual(recordRun(storage, 1000), { best: 1000, top: [1000, 900, 800, 700, 500], newBest: true });
});

test('blocked or corrupt storage never breaks the game', () => {
  const blocked = { getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('nope'); } };
  assert.deepEqual(loadRuns(blocked).top, []);
  assert.deepEqual(recordRun(blocked, 50), { best: 50, top: [50], newBest: true });
  assert.deepEqual(loadRuns(null).top, []);
  const corrupt = fakeStorage();
  corrupt.setItem('lane-runner.runs', '{oops');
  assert.deepEqual(loadRuns(corrupt).top, []);
  corrupt.setItem('lane-runner.runs', JSON.stringify({ top: ['x', 5, null] }));
  assert.deepEqual(loadRuns(corrupt).top, [5]);
});

test('runs are stored apart from slider tweaks', () => {
  const storage = fakeStorage();
  recordRun(storage, 400);
  assert.notEqual(TUNING_KEY, 'lane-runner.runs');
  storage.map.delete(TUNING_KEY); // what a defaults reset touches
  assert.deepEqual(loadRuns(storage).top, [400]);
});
