# Lane Runner — Claude instructions

## About the owner
Snehith is not a coder. Claude writes and verifies all code; Snehith plays, gives feel feedback,
and makes gameplay/design decisions. Present those decisions as plain-language choices, not code.

## Project
- Browser 3D endless runner that first copies Subway Surfers **rule for rule** (ADR 0002), then gets
  personalized. Three.js, plain HTML/JS — no build step.
- **`FEATURES.md` is the roadmap**: every Subway Surfers feature with its baseline numbers, source,
  status and Snehith's tweak. Update its Status column as features land.
- **`CONTEXT.md` is the glossary** (terms + invariants). Use its terms; update it when a term changes.
- Gameplay numbers come from public sources or gameplay measurement, not reverse engineering.
- Must work on PC (keyboard) and phone (swipe/touch), portrait and landscape.
- Never use Subway Surfers assets or the trademarked name in the game.

## Code map
- Rules: `src/rules/baseline.js` (Subway Surfers values, tagged with FEATURES.md IDs — never edit for
  taste), `src/rules/tweaks.js` (Snehith's changes, same shape, only what differs),
  `src/rules/resolve.js` (merge; unknown paths / wrong types throw), `src/rules/index.js` (`RULES`).
- Pure, unit-tested rules (no DOM/Three.js): `src/config.js` (slider defaults from `RULES.movement`,
  fingerprint, slider ranges), `src/tuning.js`
  (saved tweaks), `src/player.js` (movement + hitbox), `src/game-state.js` (start/running/paused),
  `src/input.js` (`classifySwipe`, `keyToAction`), `src/view.js` (camera fit).
- Track & run (pure, tested): `src/sections.js` (parse/validate section maps), `src/track.js` (chain
  sections into items by distance), `src/hits.js` (hitbox overlaps → crash / coins), `src/ground.js`
  (the only source of ground height), `src/runs.js` (best score + top runs, key `lane-runner.runs`).
- `sections.txt` (repo root): the hand-made sections. Snehith may edit it; the tests and the page both
  reject mistakes with the section name and line.
- Browser-only, verified by playing: `src/world.js` (Three.js scene + item models), `src/panel.js`,
  `src/main.js` (loop, crash flow, HUD, crash screen). `window.__laneRunner` exposes
  `{ game, player, cfg, track }`.
- **To make pasted "Copy settings" values permanent:** put only the values that differ from
  `BASELINE.movement` into `TWEAKS.movement` in `src/rules/tweaks.js` (with a dated comment), and note
  the tweak in FEATURES.md's *Your tweak* column. The fingerprint changes automatically.
- New gameplay numbers go in the baseline under their area (e.g. `powerUps.jetpack.duration`) with the
  FEATURES.md ID and source; 🧪 marks placeholders awaiting measurement.

## Commands
- `npm test` — run unit tests (Node built-in runner). Only commit when it reports `fail 0`.
- `npm run serve` — local server on http://localhost:8080 for browser checks (Playwright).

## Workflow
- GitHub repo `Snehiths19/lane-runner` (public) is the cloud copy; GitHub Pages hosts the game.
- Work is built in small steps (see README roadmap). **Push to GitHub after every commit** (not just at the end of a step), so Snehith can continue from claude.ai/code on any device.
- Design docs live in `docs/superpowers/specs/`, implementation plans in `docs/superpowers/plans/`. Plan first, then build with TDD.
- Verify changes by running the game in a browser (screenshots) before claiming a step is done.
