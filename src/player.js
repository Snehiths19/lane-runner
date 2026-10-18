// Player movement rules. Pure logic with no Three.js, so it can be unit tested.
// Lanes are 0 (left), 1 (middle), 2 (right).

export function createPlayer() {
  return {
    lane: 1,
    x: 0,
    fromX: 0,   // x where the current lane switch started
    switchT: 1, // 0..1 progress of the current lane switch (1 = done)
    y: 0,
    vy: 0,
    grounded: true,
    slideLeft: 0, // seconds of slide remaining
    slideQueued: false, // swiped down in the air: slide as soon as we land
  };
}

export function laneX(lane, cfg) {
  return (lane - 1) * cfg.laneWidth;
}

// Launch speed that reaches exactly jumpHeight under gravity.
export function jumpVelocity(height, gravity) {
  return Math.sqrt(2 * gravity * height);
}

// action: 'left' | 'right' | 'jump' | 'slide'
export function handleAction(p, action, cfg) {
  if (action === 'left' || action === 'right') {
    // Allowed mid-air and mid-switch, like Subway Surfers.
    const next = p.lane + (action === 'left' ? -1 : 1);
    if (next < 0 || next > 2) return;
    p.lane = next;
    p.fromX = p.x;
    p.switchT = 0;
  } else if (action === 'jump') {
    if (!p.grounded) return;
    p.vy = jumpVelocity(cfg.jumpHeight, cfg.gravity);
    p.grounded = false;
    p.slideLeft = 0; // jumping cancels a slide
  } else if (action === 'slide') {
    if (p.grounded) {
      p.slideLeft = cfg.slideTime;
    } else {
      // Mid-air: slam down, then slide on landing.
      p.vy = Math.min(p.vy, -cfg.fastFallSpeed);
      p.slideQueued = true;
    }
  }
}

export function isSliding(p) {
  return p.slideLeft > 0;
}

const easeOut = (t) => 1 - (1 - t) * (1 - t);

export function updatePlayer(p, dt, cfg) {
  if (p.switchT < 1) p.switchT = Math.min(1, p.switchT + dt / cfg.laneSwitchTime);
  p.x = p.fromX + (laneX(p.lane, cfg) - p.fromX) * easeOut(p.switchT);

  if (!p.grounded) {
    // Exact for constant gravity, so the jump arc is the same at any frame rate.
    p.y += p.vy * dt - 0.5 * cfg.gravity * dt * dt;
    p.vy -= cfg.gravity * dt;
    if (p.y <= 0) {
      p.y = 0;
      p.vy = 0;
      p.grounded = true;
      if (p.slideQueued) {
        p.slideLeft = cfg.slideTime;
        p.slideQueued = false;
      }
    }
  }

  if (p.slideLeft > 0) p.slideLeft = Math.max(0, p.slideLeft - dt);
}

// The invisible box that counts for hits, independent of the character image.
export function hitbox(p) {
  return { width: 0.8, height: isSliding(p) ? 0.8 : 1.6 };
}
