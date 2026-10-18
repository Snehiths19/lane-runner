import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS } from '../src/config.js';
import { loadTuning, saveTuning, settingsText, STORAGE_KEY } from '../src/tuning.js';

// In-memory stand-in for localStorage.
function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    map,
  };
}

test('no saved data gives defaults and no notice', () => {
  assert.deepEqual(loadTuning(fakeStorage()), { cfg: DEFAULTS, resetNotice: false });
});

test('saved tweaks load back while defaults are unchanged', () => {
  const storage = fakeStorage();
  saveTuning(storage, { ...DEFAULTS, runSpeed: 20 });
  assert.deepEqual(loadTuning(storage), { cfg: { ...DEFAULTS, runSpeed: 20 }, resetNotice: false });
});

test('stale tweaks are discarded with a one-time notice', () => {
  const storage = fakeStorage({
    [STORAGE_KEY]: JSON.stringify({ fingerprint: 'old', values: { ...DEFAULTS, runSpeed: 20 } }),
  });
  assert.deepEqual(loadTuning(storage), { cfg: DEFAULTS, resetNotice: true });
  assert.equal(loadTuning(storage).resetNotice, false, 'notice shows only once');
});

test('corrupt saved data gives defaults without crashing', () => {
  const storage = fakeStorage({ [STORAGE_KEY]: '{not json' });
  assert.deepEqual(loadTuning(storage).cfg, DEFAULTS);
});

test('blocked storage never breaks the game', () => {
  const blocked = {
    getItem() { throw new Error('SecurityError'); },
    setItem() { throw new Error('QuotaExceededError'); },
  };
  assert.deepEqual(loadTuning(blocked).cfg, DEFAULTS);
  assert.doesNotThrow(() => saveTuning(blocked, DEFAULTS));
  assert.deepEqual(loadTuning(null).cfg, DEFAULTS);
  assert.doesNotThrow(() => saveTuning(null, DEFAULTS));
});

test('non-number and unknown saved values are ignored', () => {
  const storage = fakeStorage();
  saveTuning(storage, { ...DEFAULTS, runSpeed: 'fast', bogus: 5 });
  assert.deepEqual(loadTuning(storage).cfg, DEFAULTS);
});

test('copied settings text holds exactly the tuning values', () => {
  const cfg = { ...DEFAULTS, runSpeed: 18 };
  const text = settingsText(cfg);
  assert.ok(!text.includes('\n'), 'one line');
  assert.deepEqual(JSON.parse(text), cfg);
});
