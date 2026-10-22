# Slice 2a — Dodge & Crash Implementation Plan

> **For agentic workers:** Execute natively in this session with the `tdd` skill (one test → one
> implementation), pushing after every commit; commit only when `npm test` reports `fail 0`.

**Goal:** Sections of obstacles and coins on the track, head-on crashes, Subway-style score, and a crash
screen with best score and top runs.

**Architecture:** New pure modules (tested): `sections.js` (parse + validate section maps), `track.js`
(chain sections into placed items ahead of the runner), `hits.js` (hitbox overlaps → crash / coins),
`runs.js` (best score + top runs storage). `game-state.js` gains the `crashed` state and scoring;
`player.js` lands on a supplied ground height. Browser-only: `world.js` draws items, `main.js` wires
the loop, crash flow and HUD, `crash-screen` markup in `index.html`.

**Tech Stack:** JavaScript ES modules, Three.js 0.160.0, `node:test`.

**Spec:** `docs/superpowers/specs/2026-10-22-m2a-dodge-and-crash-design.md` (+ `CONTEXT.md`, ADR 0001/0002).

## Global Constraints

- Item positions are **distance along the track** (metres from run start); the runner is at the run's
  current `game.distance`. An item at distance `d` is `d - game.distance` metres ahead.
- Lanes 0/1/2; lane x = `(lane - 1) * laneWidth`. Row length 5 m. Start clear stretch 36 m (3 s × 12).
- New baseline values (`src/rules/baseline.js`): `track: { rowLength: 5, startClear: 36 }`,
  `scoring: { pointsPerMetre: 14.6 / 12 }` (SCO-1), `crash: { screenDelay: 1.0 }` (RUN-1 🧪).
- Obstacle hitboxes (our calls): width 0.8 × laneWidth; low barrier y 0–0.8, depth 0.4; overhead bar
  y 1.0–3.0, depth 0.4; blocker y 0–4, depth = rows × 5. Coins: width 0.6, y 0.3–1.3, depth 0.6; high
  coins y 2.0–3.0. Runner hitbox: width 0.8 (centre `player.x`), depth 0.6, y from `player.y` to
  `player.y + hitbox(p).height`.
- Storage key for runs: `lane-runner.runs` (separate from `lane-runner.tuning`).

## Review Focus

1. **A typo in `sections.txt`** (unknown symbol, 4 cells in a row, blocked first row): the game must not
   load a broken section silently. → Task 2 tests `rejects …` and Task 3 test `shipped sections are valid`.
2. **Two coins / one coin over two frames**: a coin is counted once. → Task 4 test `coin counts once`.
3. **Taps during the 1 s before the crash screen**: ignored, not a restart. → Task 5 test `taps before the crash screen are ignored`.
4. **Restart leaves old items or stale coins/score**: new run is clean. → Task 5 test `new run resets`; Task 3 test `reset clears items`.
5. **Very long runs** (float drift, unbounded item list): items behind the runner are dropped. → Task 3 test `drops passed items`.

---

### Task 1: Ground height in landing

**Files:** Modify `src/player.js`, `tests/player.test.js`.
**Produces:** `updatePlayer(p, dt, cfg, groundY = 0)`; landing happens at `groundY`.

- [ ] Test `lands on the supplied ground height`: jump with `groundY = 1.5` passed every frame from a
  player starting at y 1.5, grounded → after 1 s, `p.y === 1.5` and grounded.
- [ ] Implement; existing tests unchanged. Commit `refactor: landing uses supplied ground height`.

### Task 2: Section maps

**Files:** Create `src/sections.js`, `tests/sections.test.js`.
**Produces:** `parseSections(text: string) → Section[]`, `Section = { name, rows: Cell[][] }`
(rows near→far, i.e. the **last text line is row 0**), `Cell = { obstacle: 'L'|'O'|'B'|null, coin: 'c'|'^'|null }`.
Throws `Error` mentioning section name and line number.

- [ ] Tests, one cycle each: parses a 3-row section (row order near→far); `L^` gives `{obstacle:'L', coin:'^'}`;
  blank lines and `#` comments ignored; multiple sections split on `name:`;
  `rejects unknown symbols` (`X`); `rejects rows without 3 cells`; `rejects a section whose first or last
  row isn't clear` (CONTEXT invariant); `rejects a coin inside a blocker` (`Bc`).
- [ ] Commit `feat: section map parser with validation`.

### Task 3: Track

**Files:** Create `src/track.js`, `tests/track.test.js`, `sections.txt`. Modify `src/rules/baseline.js`.
**Consumes:** `parseSections`. **Produces:** `createTrack(sections, { rowLength, startClear }, random = Math.random)`
returning `{ items, fill(upTo: number), dropBefore(d: number), reset() }`; `items` are
`{ id, kind: 'low'|'over'|'block'|'coin'|'highcoin', lane, start, end }` (distances; coins and
low/over have `end = start + depth`, blocks span their rows), sorted by `start`.

- [ ] Tests: `first item is past the start clear stretch`; `fill places sections back to back up to the
  requested distance`; `never the same section twice in a row` (two sections, seeded random, 50 picks);
  `stacked B rows become one block`; `drops passed items`; `reset clears items and restarts from 0`;
  `shipped sections are valid` (reads `sections.txt` with `fs`, parses, ≥ 8 sections).
- [ ] Write `sections.txt`: 8 original sections in Subway style (single barriers with coin arcs, barrier
  + bar alternations, blocker zig-zags, coin lines guiding lane changes), 6–12 rows each.
- [ ] Commit `feat: endless track from sections`.

### Task 4: Hits

**Files:** Create `src/hits.js`, `tests/hits.test.js`.
**Consumes:** `hitbox(p)`, track items. **Produces:** `checkHits(player, items, distance, cfg) → { crash: boolean, coins: number[] }`
(coin ids touched this frame); `collected` ids are the caller's to remove.

- [ ] Tests: `running into a low barrier crashes`; `jumping over a low barrier is safe` (y 1.0);
  `standing into an overhead bar crashes`; `rolling under an overhead bar is safe`; `blocker crashes even
  mid-jump`; `obstacle in another lane is ignored`; `coin in lane is collected`; `high coin needs a jump`;
  `coin counts once` (same coin id returned once when caller removes it).
- [ ] Commit `feat: hit detection for obstacles and coins`.

### Task 5: Crash, score and runs

**Files:** Modify `src/game-state.js`, `tests/game-state.test.js`. Create `src/runs.js`, `tests/runs.test.js`.
Modify `src/rules/baseline.js`.
**Produces:** game gets `coins`, `crashedAt`; `crash(g, now)`; `crashScreenReady(g, now, delay) → boolean`;
`routeAction` from `'crashed'`: before ready → `null` (ignored); after ready → starts a **new run**
(returns `null`, state `running`, distance/coins reset, `g.runId` incremented so main resets player &
track). `score(g, cfg) → integer` = `Math.floor(g.distance × pointsPerMetre × multiplier)` (multiplier 1).
`recordRun(storage, score) → { best, top: number[] (≤5, desc), newBest: boolean }`, `loadRuns(storage)`.

- [ ] Tests: `crash stops time`; `taps before the crash screen are ignored`; `tap after it starts a new
  run`; `new run resets distance and coins`; `score uses points per metre`; runs: `first run is a new
  best`; `keeps top five, highest first`; `blocked or corrupt storage gives empty history`; `runs survive
  a tuning reset` (different key).
- [ ] Commit `feat: crash state, Subway-style score, best score and top runs`.

### Task 6: World, HUD and crash screen (browser)

**Files:** Modify `src/world.js`, `src/main.js`, `index.html`, `styles.css`.

- [ ] `world.js`: item meshes by kind (blocker grey train-car box, low barrier yellow/black striped bar on
  legs, overhead bar red sign on two posts, coins spinning gold discs), positioned at
  `z = -(item.start - distance)`; pooled and hidden when dropped; `world.reset()`; crash flash (screen
  tint) + small runner knock-back.
- [ ] HUD: score top-right with `x1` badge, coins under it (distance HUD removed).
- [ ] Crash screen card (notebook style): score, coins, best + "New best!", top runs list, PLAY button.
- [ ] `main.js`: track fill 150 m ahead each frame, `dropBefore(distance − 10)`, `checkHits`, coins
  removed and counted, `crash()` → after `screenDelay` show card; PLAY / Space / tap → new run resets
  player, track, world.
- [ ] Verify in Playwright at 390×844 and 1440×900 with `window.__laneRunner` driving moves: jump a low
  barrier, roll an overhead bar, crash into a blocker, crash card after ~1 s, PLAY restarts; screenshots;
  no console errors. Commit `feat: obstacles, coins, HUD and crash screen in the world`.

### Task 7: Docs and publish

- [ ] FEATURES.md statuses (TRK-1–4, HIT-1, COI-1, SCO-1–2, RUN-1 → ✅), README controls/goal, CLAUDE.md
  code map (`sections.txt` editable by Snehith). Push, wait for Pages `built`, check live, hand over the
  acceptance checklist.
