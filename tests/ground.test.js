import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groundHeightAt } from '../src/ground.js';

test('ground is flat until trains add roofs (slice 2b)', () => {
  assert.equal(groundHeightAt(0, 0, []), 0);
  assert.equal(groundHeightAt(2, 500, [{ kind: 'train', lane: 2, start: 490, end: 510 }]), 0);
});
