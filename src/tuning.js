// Slider tweaks saved in this browser, kept only while the repo defaults are unchanged.
// `storage` is localStorage, or null when the browser blocks it; every access is
// guarded so storage problems never break the game.

import { DEFAULTS, defaultsFingerprint } from './config.js';

export const STORAGE_KEY = 'lane-runner.tuning';

function readSaved(storage) {
  try {
    return JSON.parse(storage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function loadTuning(storage) {
  const cfg = { ...DEFAULTS };
  const saved = readSaved(storage);
  if (!saved) return { cfg, resetNotice: false };
  if (saved.fingerprint !== defaultsFingerprint(DEFAULTS)) {
    saveTuning(storage, cfg); // record the new defaults so the notice shows once
    return { cfg, resetNotice: true };
  }
  for (const key of Object.keys(DEFAULTS)) {
    if (typeof saved.values?.[key] === 'number') cfg[key] = saved.values[key];
  }
  return { cfg, resetNotice: false };
}

export function saveTuning(storage, cfg) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({ fingerprint: defaultsFingerprint(DEFAULTS), values: cfg }));
  } catch { /* storage blocked or full: tweaks just won't persist */ }
}

// One line for the Copy settings button; paste it to Claude to make it the new defaults.
export function settingsText(cfg) {
  return JSON.stringify(Object.fromEntries(Object.keys(DEFAULTS).map((key) => [key, cfg[key]])));
}
