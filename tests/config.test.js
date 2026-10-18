import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, TUNING_RANGES, defaultsFingerprint } from '../src/config.js';

test('every default has a range and sits inside it', () => {
  assert.deepEqual(Object.keys(TUNING_RANGES).sort(), Object.keys(DEFAULTS).sort());
  for (const [key, [min, max]] of Object.entries(TUNING_RANGES)) {
    assert.ok(DEFAULTS[key] >= min && DEFAULTS[key] <= max, `${key} out of range`);
  }
});

test('fingerprint is stable', () => {
  assert.equal(defaultsFingerprint({ ...DEFAULTS }), defaultsFingerprint(DEFAULTS));
});

test('fingerprint changes when any value changes', () => {
  for (const [key, [, , step]] of Object.entries(TUNING_RANGES)) {
    const changed = { ...DEFAULTS, [key]: DEFAULTS[key] + step };
    assert.notEqual(defaultsFingerprint(changed), defaultsFingerprint(DEFAULTS), key);
  }
});

test('fingerprint ignores key order', () => {
  const reversed = Object.fromEntries(Object.entries(DEFAULTS).reverse());
  assert.equal(defaultsFingerprint(reversed), defaultsFingerprint(DEFAULTS));
});
