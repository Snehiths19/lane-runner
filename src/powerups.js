// Power-ups (CONTEXT.md): timed abilities picked up on the track. Pure logic, unit tested.
// active[name] = seconds left; names match RULES.powerUps keys.

export function createPowerUps() {
  return { active: {} };
}

// Picking up a running power-up restarts its timer.
export function collect(p, name, rules) {
  p.active[name] = rules[name].duration;
}

export function tickPowerUps(p, dt) {
  for (const name of Object.keys(p.active)) {
    p.active[name] -= dt;
    if (p.active[name] <= 0) delete p.active[name];
  }
}

export function isActive(p, name) {
  return name in p.active;
}

export function timeLeft(p, name) {
  return p.active[name] ?? 0;
}

// 2X multiplier doubles the score multiplier (x1 until missions exist).
export function scoreMultiplier(p) {
  return isActive(p, 'double') ? 2 : 1;
}

const isCoin = (item) => item.kind === 'coin' || item.kind === 'highcoin';

// Coin magnet: coins up to `range` metres ahead start flying to the runner (item.pull goes 0 → 1
// over pullTime) and keep flying once started. Returns the ids that arrived this step.
export function pullCoins(items, distance, dt, { range, pullTime }) {
  const arrived = [];
  for (const item of items) {
    if (!isCoin(item)) continue;
    if (item.pull === undefined) {
      if (item.end < distance || item.start - distance > range) continue;
      item.pull = 0;
    }
    item.pull = Math.min(1, item.pull + dt / pullTime);
    if (item.pull === 1) arrived.push(item.id);
  }
  return arrived;
}

// Removes the items with these ids from the track; returns how many were removed (each counts once).
export function takeItems(items, ids) {
  const taken = new Set(ids);
  const before = items.length;
  items.splice(0, items.length, ...items.filter((i) => !taken.has(i.id)));
  return before - items.length;
}
