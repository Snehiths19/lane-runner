// The chase (CONTEXT.md: Stumble, Chasers): the stumble timer and how far behind the runner the
// inspector and dog are (the gap, in metres). Pure logic, unit tested.

export function createChase(rules) {
  return { runTime: 0, stumbleLeft: 0, gap: rules.closeGap, catching: null };
}

export function isStumbling(c) {
  return c.stumbleLeft > 0;
}

// A side bump or edge swipe: starts a stumble, or crashes if already stumbling.
export function bump(c, rules) {
  if (isStumbling(c)) return 'crash';
  c.stumbleLeft = rules.stumbleTime;
  return 'stumble';
}

// After a crash the chasers run up and grab the runner over catchTime.
export function startCatch(c) {
  c.catching = { from: c.gap, t: 0 };
}

// dt: seconds of run time (0 while paused or before the run starts).
export function updateChase(c, dt, rules) {
  if (dt <= 0) return;
  if (c.catching) {
    c.catching.t = Math.min(1, c.catching.t + dt / rules.catchTime);
    c.gap = c.catching.from + (rules.caughtGap - c.catching.from) * c.catching.t;
    return;
  }
  c.runTime += dt;
  c.stumbleLeft = Math.max(0, c.stumbleLeft - dt);
  const close = isStumbling(c) || c.runTime < rules.startTime;
  if (close) c.gap = Math.max(rules.closeGap, c.gap - rules.closeSpeed * dt);
  else c.gap = Math.min(rules.farGap, c.gap + rules.dropSpeed * dt);
}
