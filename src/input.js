// Keyboard and swipe input. Calls onAction('left' | 'right' | 'jump' | 'slide').

const SWIPE_THRESHOLD = 30; // pixels before a drag counts as a swipe

// dx, dy in screen pixels (y grows downward).
export function classifySwipe(dx, dy, threshold = SWIPE_THRESHOLD) {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 'left' : 'right';
  return dy < 0 ? 'jump' : 'slide';
}

const KEYS = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'jump', KeyW: 'jump', Space: 'jump',
  ArrowDown: 'slide', KeyS: 'slide',
};

export function keyToAction(code) {
  return KEYS[code] ?? null;
}

// Swipes are read from `surface` (the game canvas) only, so dragging a slider
// in the panel never moves the runner. A swipe fires as soon as the finger
// passes the threshold, not on release, which makes it feel instant.
export function attachInput(surface, onAction) {
  window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.tagName === 'TEXTAREA') return;
    const action = keyToAction(e.code);
    if (!action) return;
    e.preventDefault();
    if (!e.repeat) onAction(action);
  });

  let start = null;
  surface.addEventListener('pointerdown', (e) => {
    start = { x: e.clientX, y: e.clientY };
  });
  surface.addEventListener('pointermove', (e) => {
    if (!start) return;
    const action = classifySwipe(e.clientX - start.x, e.clientY - start.y);
    if (!action) return;
    start = null; // one action per swipe
    onAction(action);
  });
  const end = () => { start = null; };
  surface.addEventListener('pointerup', end);
  surface.addEventListener('pointercancel', end);
}
