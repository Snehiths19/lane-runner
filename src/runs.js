// Best score and top runs on this device (CONTEXT.md). Stored apart from slider tweaks,
// so a "New default settings loaded" reset never touches them.

export const RUNS_KEY = 'lane-runner.runs';
const KEEP = 5;

// `storage` is localStorage or null; every access is guarded so storage problems never break the game.
export function loadRuns(storage) {
  try {
    const top = JSON.parse(storage.getItem(RUNS_KEY))?.top;
    return { top: Array.isArray(top) ? top.filter((n) => typeof n === 'number') : [] };
  } catch {
    return { top: [] };
  }
}

// Saves a finished run's score; returns the best score, top runs (highest first) and whether it's a new best.
export function recordRun(storage, score) {
  const previous = loadRuns(storage).top;
  const top = [...previous, score].sort((a, b) => b - a).slice(0, KEEP);
  try { storage.setItem(RUNS_KEY, JSON.stringify({ top })); } catch { /* not saved; still shown */ }
  return { best: top[0], top, newBest: score > (previous[0] ?? -1) };
}
