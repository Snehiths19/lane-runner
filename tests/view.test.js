import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fovForAspect } from '../src/view.js';

const rad = (deg) => (deg * Math.PI) / 180;
const horizontalFov = (vfov, aspect) => (2 * Math.atan(Math.tan(rad(vfov) / 2) * aspect) * 180) / Math.PI;

test('wide screens use the base view', () => {
  assert.equal(fovForAspect(16 / 9), 60);
});

test('upright phone widens the view enough to keep all lanes', () => {
  const aspect = 390 / 844;
  const vfov = fovForAspect(aspect);
  assert.ok(vfov > 60);
  assert.ok(Math.abs(horizontalFov(vfov, aspect) - 62) < 0.01);
});

test('extremely narrow screens are capped', () => {
  assert.equal(fovForAspect(0.2), 100);
});
