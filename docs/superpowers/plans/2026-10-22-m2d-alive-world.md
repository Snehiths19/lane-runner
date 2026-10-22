# Slice 2d — Alive world Implementation Plan

> TDD (one test → one implementation), push after every commit; commit only when `npm test` reports `fail 0`.

**Spec:** `docs/superpowers/specs/2026-10-22-m2d-alive-world-design.md`

## Review Focus

1. **Fast oncoming front misread as a side bump** (train front moves too): head-on uses the train's
   previous front. → Task 2 test `moving train front arriving this frame is head-on even mid-switch`.
2. **Ramp in front of a moving train** must be rejected. → Task 1 test.
3. **Moving train meets the runner where the map shows** at constant speed. → Task 2 test.
4. **Intro leap clears the intro train** with the baseline and tweaked speeds. → Task 4 test.
5. **Camera follow is frame-rate independent.** → Task 5 test (30 vs 144 fps end within 1e-3).

### Task 1: `M` in section maps (`sections.js`)
Tests: parses `M`; stacked; rejects `R` under `M`; rejects anything in an `M` lane above it. Commit.
### Task 2: Moving train items and motion (`track.js`, `hits.js`)
Tests: placement shift; `move(dt)` moves only moving trains and keeps `prevStart`; meets at map position;
head-on with previous front. Commit.
### Task 3: Speed ramp (`game-state.js`)
Tests: `speedAt` start, middle, cap; `advance` keeps run time; new run resets it. Commit.
### Task 4: Intro leap (`player.js`, `track.js`)
Tests: `startIntro` leaps to the height, ignores swipes, ends on landing; intro train passes under while
y > roof. Commit.
### Task 5: Tunnels and camera (`tunnels.js`, `view.js`)
Tests: `tunnelsBetween`; `followCamera` lag, lift share, fps independence. Commit.
### Task 6: Wire up (`main.js`, `world.js`), new sections, browser checks. Commit.
### Task 7: Docs (FEATURES, STATUS, HISTORY). Commit.
