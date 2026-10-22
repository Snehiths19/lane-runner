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
| **M2 · 2d** | **Alive world: moving trains, tunnels, speed ramp, intro leap, jump/sideways camera** | **⏭ next** |
| M3–M6 | Power-ups → hoverboard/keys/revive → progression/shop → events/world | ⬜ |
| Personal | Music, Snehith's face, friend events, San Jose | ⬜ |

Tests: 114 passing (`npm test`). Snehith's only tweak so far: run speed 20 (`src/rules/tweaks.js`).

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

## Next: slice 2d, the alive world

FEATURES IDs: TRK-6 (moving trains), TRK-9 (tunnels), MOV-6 (speed ramp), CHS-2 (intro leap),
CAM-1 (jump lift and sideways camera follow).

Snehith usually accepts every grill recommendation: take the recommended answers, record them in
`CONTEXT.md` and the design doc, list them in the summary, and keep building.

Open questions for the 2d grill (suggested order):
1. How fast moving trains come at you and how often they appear in sections.
2. Speed ramp: how fast speed rises and where it caps (measure from Poki 🧪).
3. Intro: how much of the graffiti scene to copy before the leap, and whether a tap skips it.
4. Tunnels: looks only, or also walls that block lane changes.
5. Camera: how much it lifts on jumps and slides with lane changes.

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
