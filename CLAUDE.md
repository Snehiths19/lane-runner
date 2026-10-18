# Lane Runner — Claude instructions

## About the owner
Snehith is not a coder. Claude writes and verifies all code; Snehith plays, gives feel feedback,
and makes gameplay/design decisions. Present those decisions as plain-language choices, not code.

## Project
- Browser 3D endless runner (Subway Surfers-inspired), Three.js, plain HTML/JS — no build step.
- Must work on PC (keyboard) and phone (swipe/touch), portrait and landscape.
- Tuning values (speed, gravity, jump, lane-switch time) live in one config and are exposed via an on-screen slider panel.
- Never use Subway Surfers assets or the trademarked name in the game.

## Code map
- Pure, unit-tested rules (no DOM/Three.js): `src/config.js` (defaults + fingerprint), `src/tuning.js`
  (saved tweaks), `src/player.js` (movement + hitbox), `src/game-state.js` (start/running/paused),
  `src/input.js` (`classifySwipe`, `keyToAction`), `src/view.js` (camera fit).
- Browser-only, verified by playing: `src/world.js` (Three.js scene), `src/panel.js`, `src/main.js`.
- To make pasted "Copy settings" values permanent: update `DEFAULTS` in `src/config.js` (sliders'
  ranges are in `TUNING_RANGES`); the fingerprint changes automatically.

## Commands
- `npm test` — run unit tests (Node built-in runner). Only commit when it reports `fail 0`.
- `npm run serve` — local server on http://localhost:8080 for browser checks (Playwright).
  `window.__laneRunner` exposes `{ game, player, cfg }` for checks.

## Workflow
- GitHub repo `Snehiths19/lane-runner` (public) is the cloud copy; GitHub Pages hosts the game.
- Work is built in small steps (see README roadmap). **Push to GitHub after every commit** (not just at the end of a step), so Snehith can continue from claude.ai/code on any device.
- Design docs live in `docs/superpowers/specs/`, implementation plans in `docs/superpowers/plans/`. Plan first, then build with TDD.
- Verify changes by running the game in a browser (screenshots) before claiming a step is done.
