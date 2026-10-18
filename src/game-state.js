// Game states: 'start' -> 'running' <-> 'paused' ('crashed' arrives in step 2).
// Movement and world time only advance while running.

export function createGame() {
  return { state: 'start', distance: 0 };
}

// Returns the action the runner should perform, or null if it should be ignored.
export function routeAction(g, action) {
  if (g.state === 'start') {
    g.state = 'running';
    return null;
  }
  return g.state === 'running' ? action : null;
}

// Only a run can be paused; the start screen is already still.
export function setPaused(g, paused) {
  if (paused && g.state === 'running') g.state = 'paused';
  else if (!paused && g.state === 'paused') g.state = 'running';
}

// Moves the world forward; returns how much time actually passed for the runner.
export function advance(g, dt, speed) {
  if (g.state !== 'running') return 0;
  g.distance += speed * dt;
  return dt;
}

// After a long gap (tab hidden, phone locked) the world just resumes
// instead of jumping ahead in time.
export function clampDt(dt) {
  return Math.min(dt, 0.05);
}
