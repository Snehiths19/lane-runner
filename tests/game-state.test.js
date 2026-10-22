import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, routeAction, setPaused, advance, clampDt, crash, crashScreenReady, score } from '../src/game-state.js';

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

test('score is distance times points per metre times the multiplier, rounded down', () => {
  const g = runningGame();
  g.distance = 100;
  assert.equal(score(g, { scoring: { pointsPerMetre: 14.6 / 12 } }), 121);
});
