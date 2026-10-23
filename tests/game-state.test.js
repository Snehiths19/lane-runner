import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, routeAction, setPaused, advance, clampDt, crash, crashScreenReady, score, speedAt, substeps } from '../src/game-state.js';

test('begins on the start screen', () => {
  const g = createGame();
  assert.equal(g.state, 'start');
  assert.equal(g.distance, 0);
});

test('the action that leaves the start screen is not also a move', () => {
  const g = createGame();
  assert.equal(routeAction(g, 'jump'), null);
  assert.equal(g.state, 'running');
});

test('running passes actions through', () => {
  const g = createGame();
  routeAction(g, 'jump');
  assert.equal(routeAction(g, 'left'), 'left');
});

test('paused blocks actions and time', () => {
  const g = createGame();
  routeAction(g, 'jump');
  setPaused(g, true);
  assert.equal(g.state, 'paused');
  assert.equal(routeAction(g, 'left'), null);
  assert.equal(advance(g, 0.016, 12), 0);
  assert.equal(g.distance, 0);
});

test('unpausing resumes the run', () => {
  const g = createGame();
  routeAction(g, 'jump');
  setPaused(g, true);
  setPaused(g, false);
  assert.equal(g.state, 'running');
});

test('opening the panel on the start screen keeps the start screen', () => {
  const g = createGame();
  setPaused(g, true);
  setPaused(g, false);
  assert.equal(g.state, 'start');
});

test('distance accumulates while running', () => {
  const g = createGame();
  routeAction(g, 'jump');
  for (let i = 0; i < 60; i++) advance(g, 1 / 60, 12);
  assert.ok(Math.abs(g.distance - 12) < 1e-9);
});

test('clampDt caps large frame gaps (tab hidden, phone locked)', () => {
  assert.equal(clampDt(30), 0.05);
  assert.equal(clampDt(0.016), 0.016);
});

function runningGame() {
  const g = createGame();
  routeAction(g, 'jump');
  return g;
}

test('a crash stops time and the runner', () => {
  const g = runningGame();
  crash(g, 10);
  assert.equal(g.state, 'crashed');
  assert.equal(advance(g, 0.016, 12), 0);
  assert.equal(routeAction(g, 'left'), null);
});

test('taps before the crash screen are ignored', () => {
  const g = runningGame();
  crash(g, 10);
  assert.equal(crashScreenReady(g, 10.5, 1), false);
  assert.equal(routeAction(g, 'jump'), null);
  assert.equal(g.state, 'crashed');
});

test('a tap on the crash screen starts a new, clean run', () => {
  const g = runningGame();
  g.distance = 250;
  g.coins = 7;
  const runId = g.runId;
  crash(g, 10);
  assert.equal(crashScreenReady(g, 11, 1), true);
  assert.equal(routeAction(g, 'jump'), null, 'the tap only restarts');
  assert.equal(g.state, 'running');
  assert.equal(g.distance, 0);
  assert.equal(g.coins, 0);
  assert.notEqual(g.runId, runId);
});

test('score is metres run times points per metre, rounded down', () => {
  const g = runningGame();
  advance(g, 10, 10);
  assert.equal(score(g, { scoring: { pointsPerMetre: 14.6 / 12 } }), 121);
});

test('a multiplier only counts for the metres run while it is on', () => {
  const g = runningGame();
  advance(g, 10, 10);       // 100 m at x1
  advance(g, 5, 10, 2);     // 50 m at x2
  advance(g, 5, 10);        // 50 m at x1
  assert.equal(g.distance, 200);
  assert.equal(score(g, { scoring: { pointsPerMetre: 1 } }), 100 + 100 + 50);
});

const ramp = { rampTime: 150, maxBoost: 0.6 };

test('speed ramp: starts at run speed, rises evenly, then holds at the cap', () => {
  assert.equal(speedAt(0, 20, ramp), 20);
  assert.ok(Math.abs(speedAt(75, 20, ramp) - 26) < 1e-9);
  assert.ok(Math.abs(speedAt(150, 20, ramp) - 32) < 1e-9);
  assert.ok(Math.abs(speedAt(600, 20, ramp) - 32) < 1e-9);
});

test('run time counts only while running and restarts with a new run', () => {
  const g = createGame();
  advance(g, 1, 12);
  assert.equal(g.time, 0, 'not on the start screen');
  routeAction(g, 'jump');
  advance(g, 0.5, 12);
  advance(g, 0.5, 12);
  assert.equal(g.time, 1);
  crash(g, 10);
  advance(g, 1, 12);
  assert.equal(g.time, 1, 'not after a crash');
  crashScreenReady(g, 20, 1);
  routeAction(g, 'jump');
  assert.equal(g.time, 0);
});

test('a frame is split so no step moves more than 0.25 m', () => {
  assert.equal(substeps(1 / 60, 12), 1);
  const n = substeps(0.05, 32); // ramped top speed on a slow phone frame
  assert.ok((32 * 0.05) / n <= 0.25, `${n} steps`);
  assert.equal(substeps(0.05, 0), 1);
});
