// Run states (CONTEXT.md): 'start' -> 'running' <-> 'paused' -> 'crashed' -> crash screen -> new run.
// Movement and world time only advance while running.

export function createGame() {
  return { state: 'start', distance: 0, time: 0, coins: 0, runId: 1, crashedAt: null, crashScreenShown: false };
}

function startNewRun(g) {
  Object.assign(g, { state: 'running', distance: 0, time: 0, coins: 0, runId: g.runId + 1, crashedAt: null, crashScreenShown: false });
}

// Returns the action the runner should perform, or null if it should be ignored.
export function routeAction(g, action) {
  if (g.state === 'start') {
    g.state = 'running';
    return null;
  }
  if (g.state === 'crashed') {
    // Taps only count once the crash screen is showing, and then only restart.
    if (g.crashScreenShown) startNewRun(g);
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
  g.time += dt;
  return dt;
}

// Speed ramp (CONTEXT.md): run speed rises evenly by maxBoost over rampTime seconds, then holds.
export function speedAt(time, runSpeed, { rampTime, maxBoost }) {
  return runSpeed * (1 + maxBoost * Math.min(1, time / rampTime));
}

// After a long gap (tab hidden, phone locked) the world just resumes
// instead of jumping ahead in time.
export function clampDt(dt) {
  return Math.min(dt, 0.05);
}

// The runner hit something: the world stops. `now` is in seconds.
export function crash(g, now) {
  g.state = 'crashed';
  g.crashedAt = now;
}

// True once `delay` seconds have passed since the crash; the crash screen shows from then on.
export function crashScreenReady(g, now, delay) {
  if (g.state === 'crashed' && now - g.crashedAt >= delay) g.crashScreenShown = true;
  return g.crashScreenShown;
}

// Subway-style score: distance-based points times the score multiplier (x1 until missions exist).
export function score(g, rules, multiplier = 1) {
  return Math.floor(g.distance * rules.scoring.pointsPerMetre * multiplier);
}
