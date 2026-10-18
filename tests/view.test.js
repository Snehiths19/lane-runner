import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fovForAspect } from '../src/view.js';

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
