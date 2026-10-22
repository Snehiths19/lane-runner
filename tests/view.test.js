import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fovForAspect, followCamera } from '../src/view.js';

const rad = (deg) => (deg * Math.PI) / 180;
const horizontalFov = (vfov, aspect) => (2 * Math.atan(Math.tan(rad(vfov) / 2) * aspect) * 180) / Math.PI;

test('wide screens use the base view', () => {
  assert.equal(fovForAspect(16 / 9), 60);
});

test('upright phones widen the view enough to keep all lanes, without hitting the cap', () => {
  for (const [w, h] of [[390, 844], [360, 800], [430, 932]]) {
    const vfov = fovForAspect(w / h);
    assert.ok(vfov > 60 && vfov < 100, `${w}x${h}: ${vfov}`);
    assert.ok(Math.abs(horizontalFov(vfov, w / h) - 55) < 0.01, `${w}x${h}`);
  }
});

test('extremely narrow screens are capped', () => {
  assert.equal(fovForAspect(0.2), 100);
});

const camRules = { jumpFollow: 0.4, sideLag: 0.12, liftLag: 0.15 };

test('camera lags behind sideways, then settles on the target', () => {
  const cam = { x: 0, lift: 0 };
  followCamera(cam, { x: 1.25, lift: 0 }, 1 / 60, camRules);
  assert.ok(cam.x > 0 && cam.x < 0.5, `moved a little: ${cam.x}`);
  for (let i = 0; i < 120; i++) followCamera(cam, { x: 1.25, lift: 0 }, 1 / 60, camRules);
  assert.ok(Math.abs(cam.x - 1.25) < 1e-3);
});

test('camera follow is the same at any frame rate', () => {
  const run = (fps) => {
    const cam = { x: 0, lift: 0 };
    for (let i = 0; i < fps * 0.2; i++) followCamera(cam, { x: 1.25, lift: 2 }, 1 / fps, camRules);
    return cam;
  };
  const a = run(30);
  const b = run(120);
  assert.ok(Math.abs(a.x - b.x) < 1e-3 && Math.abs(a.lift - b.lift) < 1e-3, JSON.stringify({ a, b }));
});
