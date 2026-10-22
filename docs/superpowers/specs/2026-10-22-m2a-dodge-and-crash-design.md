# Slice 2a — Dodge & Crash: Design

Date: 2026-10-22 · Decided in a grill-with-docs session (see `CONTEXT.md`, ADR 0001, ADR 0002).
Covers FEATURES.md: TRK-1–4, HIT-1, COI-1, SCO-1–2, RUN-1.

## Intent

Turn the canvas into a game: the track fills with obstacles and coins from hand-made **sections**,
a **head-on hit** is a **crash**, the run is scored like Subway Surfers, and the **crash screen** offers
another run. This is the base loop later slices hang on (trains, chase, power-ups).

## Goals

1. **Sections** (ADR 0001): original designs in Subway Surfers' style, written as **section maps** in
   `sections.txt`. ~8 to start. Symbols: `.` empty · `L` low barrier · `O` overhead bar · `B` blocker ·
   `c` coin · `^` high coin. A cell may combine an obstacle with a coin (`L^`). Cells are separated by
   spaces; one row = 5 m; stacked `B` rows form one long blocker. Every section's first and last row
   are clear (invariant). Each section has a `name:` line.
2. **Track**: sections chained endlessly in random order, never the same one twice in a row, after a
   clear stretch at the start of every run (placeholder for the intro leap in 2d).
3. **Obstacles**: low barrier (jump over), overhead bar (roll under), blocker (change lanes).
   Any hitbox overlap with an obstacle in slice 2a is a **crash** (side bumps arrive in 2c).
4. **Coins**: collected when the runner's hitbox touches them; high coins only by jumping.
5. **Score**: distance × points-per-metre × score multiplier (x1 until missions). Points per metre are
   set so the baseline start speed scores ≈ 14.6 points/s (measured). HUD like Subway Surfers: score
   top-right with "x1" badge, coins under it.
6. **Crash**: hit flash and knock-back, world stops; after ~1 s the **crash screen** appears (taps
   before that are ignored).
7. **Crash screen**: notebook-style card: score, coins this run, best score with "New best!", **top runs**
   (five best on this device), and PLAY. PLAY (tap / Space) starts a new run immediately and never
   also moves the runner.
8. **Best score and top runs** persist per device, stored apart from slider tweaks.

## Rules that hold (from CONTEXT.md)

- Ground height comes from one place; landing asks it (0 everywhere in 2a).
- Hitbox is separate from image; obstacle hitboxes are fixed boxes per kind.
- Placing is generic (coins and later friend events use the same placement).
- Baseline values live in `src/rules/baseline.js` with FEATURES IDs; tweaks only in `tweaks.js`.

## Numbers (baseline, our calls marked)

- Row length 5 m (our call). Start clear stretch: 3 s at baseline speed (our call; 2d replaces it).
- Points per metre: 14.6 ÷ baseline run speed (SCO-1, measured rate; recompute if the speed is measured).
- Crash screen delay ~1 s (our call 🧪 until measured).
- Obstacle hitboxes (our calls, tuned by playtest): low barrier height 0.8; overhead bar from 1.0 up
  (rolling hitbox 0.8 passes, standing 1.6 hits); blocker full height; obstacles ~80% of lane width.
  Coins at 0.3–1.3 high; high coins at 2.0–3.0.

## Non-goals (later slices)

Trains, ramps, roofs (2b) · side bumps, stumbles, edge-swipe stumble, inspector & dog (2c) · moving
trains, tunnels, speed ramp, intro leap, camera follow (2d) · revive and keys (M4) · Menu/Boosts (M5).

## Deviation from the grill

Absolute run speed isn't reliably measurable from video (perspective), so the baseline speed stays a
labeled placeholder and section spacing is designed from obstacle timing in seconds, measured from
gameplay when sections are tuned.

## Acceptance

Claude: all unit tests pass; in a browser at phone and PC sizes: obstacles appear, jumping a low
barrier and rolling under an overhead bar survive, hitting a blocker crashes, coins count, the crash
screen appears after ~1 s with score/best/top runs, PLAY restarts cleanly; screenshots.

Snehith on phone + PC: (1) obstacles and coins appear and feel fair; (2) each obstacle is beaten by
its move; (3) crashing shows the crash screen; (4) PLAY starts a new run; (5) best score and top runs
survive a reload.
