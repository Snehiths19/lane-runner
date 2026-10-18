import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS } from '../src/config.js';
import { createPlayer, handleAction, updatePlayer, isSliding, hitbox } from '../src/player.js';

const cfg = { ...DEFAULTS };

// Runs the player forward `seconds` at 60fps; returns the highest y seen.
function step(p, seconds, c = cfg) {
  let maxY = p.y;
  for (let t = 0; t < seconds - 1e-9; t += 1 / 60) {
    updatePlayer(p, 1 / 60, c);
    maxY = Math.max(maxY, p.y);
  }
  return maxY;
}

test('starts in middle lane on the ground', () => {
  const p = createPlayer();
  assert.equal(p.lane, 1);
  assert.equal(p.x, 0);
  assert.equal(p.y, 0);
  assert.equal(p.grounded, true);
});

test('lane switch reaches target in laneSwitchTime', () => {
  const p = createPlayer();
  handleAction(p, 'left', cfg);
  step(p, cfg.laneSwitchTime);
  assert.equal(p.lane, 0);
  assert.ok(Math.abs(p.x - -2.5) < 1e-9, `x was ${p.x}`);
});

test('cannot leave the track', () => {
  const p = createPlayer();
  handleAction(p, 'left', cfg);
  handleAction(p, 'left', cfg);
  assert.equal(p.lane, 0);
  step(p, 0.5);
  handleAction(p, 'left', cfg);
  step(p, 0.5);
  assert.equal(p.lane, 0);
  assert.ok(Math.abs(p.x - -2.5) < 1e-9);
});

test('redirect mid-switch starts from current x', () => {
  const p = createPlayer();
  handleAction(p, 'left', cfg);
  step(p, 0.05);
  const midX = p.x;
  assert.ok(midX < 0 && midX > -2.5);
  handleAction(p, 'right', cfg);
  updatePlayer(p, 0, cfg);
  assert.ok(Math.abs(p.x - midX) < 1e-9, 'no teleport on redirect');
  step(p, cfg.laneSwitchTime);
  assert.ok(Math.abs(p.x) < 1e-9);
});

test('jump peaks at jumpHeight and lands after the expected air time', () => {
  const p = createPlayer();
  handleAction(p, 'jump', cfg);
  assert.equal(p.grounded, false);
  const airTime = 2 * Math.sqrt(2 * cfg.gravity * cfg.jumpHeight) / cfg.gravity;
  const peak = step(p, airTime - 0.05);
  assert.ok(Math.abs(peak - cfg.jumpHeight) < 0.05, `peak ${peak}`);
  assert.equal(p.grounded, false);
  step(p, 0.1);
  assert.equal(p.grounded, true);
  assert.equal(p.y, 0);
});

test('jump height is the same at 30, 60 and 144 fps', () => {
  for (const fps of [30, 60, 144]) {
    const p = createPlayer();
    handleAction(p, 'jump', cfg);
    let peak = 0;
    for (let i = 0; i < fps; i++) {
      updatePlayer(p, 1 / fps, cfg);
      peak = Math.max(peak, p.y);
    }
    assert.ok(Math.abs(peak - cfg.jumpHeight) < 0.05, `${fps}fps peak ${peak}`);
  }
});

test('no double jump', () => {
  const p = createPlayer();
  handleAction(p, 'jump', cfg);
  step(p, 0.2);
  const vy = p.vy;
  handleAction(p, 'jump', cfg);
  assert.equal(p.vy, vy);
});

test('lane switch allowed mid-air', () => {
  const p = createPlayer();
  handleAction(p, 'jump', cfg);
  step(p, 0.1);
  handleAction(p, 'right', cfg);
  step(p, cfg.laneSwitchTime);
  assert.equal(p.lane, 2);
  assert.ok(Math.abs(p.x - 2.5) < 1e-9);
  assert.equal(p.grounded, false, 'still in the air');
});

test('slide lasts slideTime', () => {
  const p = createPlayer();
  handleAction(p, 'slide', cfg);
  step(p, 0.5);
  assert.equal(isSliding(p), true);
  step(p, 0.15);
  assert.equal(isSliding(p), false);
});

test('jump cancels slide', () => {
  const p = createPlayer();
  handleAction(p, 'slide', cfg);
  step(p, 0.1);
  handleAction(p, 'jump', cfg);
  assert.equal(isSliding(p), false);
  assert.equal(p.grounded, false);
});

test('swipe down mid-air fast-falls, then slides on landing', () => {
  const p = createPlayer();
  handleAction(p, 'jump', cfg);
  step(p, 0.15);
  handleAction(p, 'slide', cfg);
  assert.ok(p.vy <= -cfg.fastFallSpeed, `vy ${p.vy}`);
  assert.equal(isSliding(p), false, 'not sliding in the air');
  step(p, 0.3);
  assert.equal(p.grounded, true);
  assert.equal(isSliding(p), true, 'slides on landing');
});

test('hitbox shrinks while sliding', () => {
  const p = createPlayer();
  assert.deepEqual(hitbox(p), { width: 0.8, height: 1.6 });
  handleAction(p, 'slide', cfg);
  assert.deepEqual(hitbox(p), { width: 0.8, height: 0.8 });
});

test('extreme tuning still lands and reaches the lane', () => {
  const c = { ...cfg, laneSwitchTime: 0.04, gravity: 10, jumpHeight: 5 };
  const p = createPlayer();
  handleAction(p, 'jump', c);
  handleAction(p, 'left', c);
  step(p, 3, c);
  assert.equal(p.grounded, true);
  assert.ok(Math.abs(p.x - -2.5) < 1e-9);
});
