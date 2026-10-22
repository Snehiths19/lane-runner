# Status & next steps

The handoff note for any new session (terminal, desktop or claude.ai project). Read this first,
then `CLAUDE.md`, `CONTEXT.md`, `FEATURES.md` and `docs/HISTORY.md` (the full story: what was tried
and rejected, how the goal evolved, every decision by session). Update this file at the end of every slice.

_Last updated: 2026-10-22._

## Where we are

**Goal:** copy Subway Surfers rule for rule first (the **baseline**), then personalize it with
**tweaks**, skins and friend events (ADR 0002). Live: https://snehiths19.github.io/lane-runner/

| Stage | What | State |
|---|---|---|
| M1 | Movement canvas: 3 lanes, jump, roll, swipe + keys, tuning sliders | ✅ accepted |
| — | Baseline / tweaks rules layer (`src/rules/`) + `FEATURES.md` checklist | ✅ |
| M2 · 2a | Dodge & crash: sections, obstacles, coins, crash, score, crash card, top runs | ✅ accepted |
| M2 · 2b | Trains: ramps, roofs, roof coins, roof hopping, side-bump bounce, surface camera | ✅ accepted |
| M2 · 2c | Chase: stumble, inspector & dog, edge-swipe stumble | ✅ accepted |
| M2 · 2d | Alive world: moving trains, tunnels, speed ramp, intro leap, jump/sideways camera | ✅ built, awaiting Snehith's check |
| **M3** | **Power-ups** | **⏭ next** |
| M3–M6 | Power-ups → hoverboard/keys/revive → progression/shop → events/world | ⬜ |
| Personal | Music, Snehith's face, friend events, San Jose | ⬜ |

Tests: 134 passing (`npm test`). Snehith's only tweak so far: run speed 20 (`src/rules/tweaks.js`).

## How we work (Snehith's preferred process)

The skills this uses (`/grill-with-docs`, `/grill-me`, `/tdd`) are copied into `.claude/skills/`, so
cloud sessions have them too. The writing-plans skill comes from the superpowers plugin; if a session
doesn't have it, follow the plan format of the existing files in `docs/superpowers/plans/`.

Snehith is not a coder: Claude builds and verifies; Snehith decides gameplay and checks feel.

1. **Grill** the slice with `/grill-with-docs`: one question at a time, each with a recommendation
   and tradeoff, in plain language. Update `CONTEXT.md` (terms, invariants) as answers land; offer an
   ADR only for hard-to-reverse, surprising trade-offs. Record scope changes in `FEATURES.md`.
2. **Design doc** → `docs/superpowers/specs/YYYY-MM-DD-<slice>-design.md`.
3. **Plan** (writing-plans skill) → `docs/superpowers/plans/YYYY-MM-DD-<slice>.md`, with a Review Focus
   of the 5 riskiest edge cases, each pinned by a test.
4. **Build** with `/tdd`: one test → one implementation. Commit only when `npm test` reports
   `fail 0`, and **push after every commit**.
5. **Verify in a browser** at phone (390×844) and PC (1440×900) sizes. Inject exact layouts via
   `window.__laneRunner.track.items` to test specific situations; check the console for errors.
6. **Publish**: wait for GitHub Pages to build, check the live site, update `FEATURES.md` statuses and
   this file, then give Snehith a short acceptance checklist.

Decide each slice just before building it (not all up front).

## Done: slice 2c, the chase (accepted 2026-10-22: "Looks good")

Spec `docs/superpowers/specs/2026-10-22-m2c-chase-design.md`, plan `docs/superpowers/plans/2026-10-22-m2c-chase.md`.
`src/chase.js` (stumble timer, chasers' gap, catch), baseline `chase` numbers, edge swipe nudge in
`player.js`, inspector and dog cutouts in `world.js`. Stumble length (3 s) and the start chase (2 s)
are 🧪 placeholders to measure from Poki gameplay.

Snehith's acceptance check: (1) the inspector and dog are there at the start and drop back;
(2) bumping a train's side brings them close for a few seconds; (3) a second bump while they're close
ends the run and they grab you; (4) swiping into the wall at the edge counts as a bump; (5) it still
feels fair on phone and PC.

## Just built: slice 2d, the alive world

Spec `docs/superpowers/specs/2026-10-22-m2d-alive-world-design.md`, plan
`docs/superpowers/plans/2026-10-22-m2d-alive-world.md`. Moving trains (`M` in sections, `track.move`),
speed ramp (`speedAt`, `game.time`), intro leap (`startIntro`, `track.addIntroTrain`), tunnels
(`src/tunnels.js`, looks only), camera follow (`followCamera`). Also fixed: at high speed a runner
could be lifted onto a train roof instead of crashing into its front (`groundHeightAt` now takes the
runner's height and last distance).

Snehith's acceptance check: (1) the run opens with a leap over a train; (2) some trains drive at you
and feel fair to dodge; (3) the game gets faster the longer you run; (4) tunnels pass by; (5) the
camera feels alive on jumps and lane changes without making you dizzy.

## Next: M3, power-ups

FEATURES IDs: PWR-1 to PWR-7 (magnet, jetpack, super sneakers, 2X multiplier, pogo stick, timer
overlap, mystery box). Snehith usually accepts every grill recommendation: take the recommended answers,
record them in `CONTEXT.md` and the design doc, list them in the summary, and keep building.

Open questions for the M3 grill (suggested order):
1. Split M3 into slices (e.g. 3a magnet + 2X, 3b sneakers + jetpack, 3c pogo + mystery box)?
2. How power-ups appear in sections (a new symbol) and how often.
3. Base durations before upgrades (🧪, measure from Poki).
4. Jetpack: coin trail height and how landing works over trains.
5. On-screen timer look for active power-ups.

Cloud-session browser checks: jsdelivr (the three.js CDN) is blocked by the cloud proxy. Get three
from npm (`npm pack three@0.160.0`) and serve it to the page with Playwright `page.route`; use the
preinstalled Chromium at `/opt/pw-browsers/chromium`. Software WebGL runs slower than real time at
PC size, so wait on game time (`__laneRunner.chase.runTime`), not wall time.

## Measuring Subway Surfers (for 🧪 numbers)

The official web version is on Poki (by SYBO): https://poki.com/en/g/subway-surfers. Record its frames
at ~59 fps with timestamps using Chrome's screencast through Playwright, then lay them out as labeled
contact sheets. Tools and steps: `tools/measure/README.md`. Notes: the camera follows the runner, so
on-screen motion understates real motion; absolute run speed isn't measurable (perspective), timing
is; Poki shows video ads between runs; the run crashes quickly with nobody steering. The fan wiki
blocks automated reading; use SYBO's help center and search results.

Measured so far: jump air time ≈ 0.7 s (→ gravity 36), lane switch ≈ 0.15–0.2 s (rough), score
≈ 14.6 points/s at x1 at run start, camera follows surface/jumps/lane changes, run intro is a leap
over an oncoming train.
