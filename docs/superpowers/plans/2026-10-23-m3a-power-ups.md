# Slice 3a — Power-ups Implementation Plan

> TDD, push after every commit; commit only when `npm test` reports `fail 0`.
**Spec:** `docs/superpowers/specs/2026-10-23-m3a-power-ups-design.md`

## Review Focus
1. **Points add up per step** (2X mid-run must not double past points). → Task 1 test.
2. **Re-pickup restarts the timer**, doesn't stack. → Task 2 test.
3. **Magnet only pulls coins ahead within range**, never behind or far ahead. → Task 3 test.
4. **A pulled coin is counted once** even if the runner also touches it. → Task 3 test.
5. **`p` on a roof sits on the roof** like a roof coin. → Task 4 test.

### Task 1: points and multiplier (`game-state.js`)
### Task 2: power-up timers (`src/powerups.js`): start, tick, active, multiplier
### Task 3: magnet pull (`src/powerups.js`)
### Task 4: `p` in sections and track; hits report power-ups (`sections.js`, `track.js`, `hits.js`)
### Task 5: wire up, pickup models, coin fly-in, HUD timers (`main.js`, `world.js`, `index.html`, `styles.css`); sections
### Task 6: docs
