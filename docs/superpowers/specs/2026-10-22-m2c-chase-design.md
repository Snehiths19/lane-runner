# Slice 2c — Chase: Design

Date: 2026-10-22 · Decided in a grill session in the claude.ai project thread (see `CONTEXT.md`:
Stumble, Chasers, Side bump). Covers FEATURES.md HIT-2 (stumble half), HIT-3, CHS-1, MOV-7.

## Intent

Give every run Subway Surfers' pressure: the **chasers** (inspector & dog) start right behind you,
drop back, close in again when you **stumble**, and grab you when you **crash**. A side bump is now a
warning; a second one during the warning ends the run.

## Decisions (Snehith, 2026-10-22)

1. **Looks:** two flat cutouts drawn like the runner: a tall inspector and a small dog, shown behind
   the runner only when close. Real art later as skins.
2. **Stumble feel:** baseline. No slowdown, full control; the chasers run right behind you for the
   stumble window (placeholder 3 s 🧪), then drop back.
3. **Catch:** within the existing 1 s pause after a crash, the chasers run up and grab the runner; then
   the crash screen shows as before.
4. **Start:** the chasers are close for the first ~2 s of every run, then drop back out of view (the 2d
   intro leap will play before this later).
5. (Already decided) **Edge swipe** into the wall at the track edge is a side bump → stumble (baseline).

## Goals

1. **Stumble.** A *new* side bump (one that starts a bounce back) or an edge swipe starts a stumble of
   `chase.stumbleTime`. A new side bump or edge swipe while stumbling is a crash. Staying in contact
   with the same train while bouncing back is not a second bump.
2. **Edge swipe.** Swiping left in the left lane (or right in the right lane) gives a short sideways
   nudge toward the wall and back, then counts as a side bump.
3. **Chase distance.** One number, the **gap** (metres behind the runner). Target gap is `closeGap`
   while stumbling or in the first `startTime` seconds of a run, else `farGap` (out of view). The gap
   moves toward its target at `closeSpeed` (closing) or `dropSpeed` (dropping back). Only running
   time counts (pauses freeze it).
4. **Catch.** On a crash the gap shrinks to `caughtGap` over `catchTime`, inside `crash.screenDelay`.
5. **World.** The inspector and dog stand side by side behind the runner at the gap, following the
   runner sideways and the surface height; hidden when the gap is beyond the camera.

## Numbers (baseline `chase`, our calls unless 🧪)

stumbleTime 3 s 🧪 (HIT-3, to measure) · startTime 2 s 🧪 (CHS-1) · closeGap 2.5 m · farGap 8 m ·
closeSpeed 8 m/s · dropSpeed 3 m/s · caughtGap 0.4 m · catchTime 0.5 s. Edge nudge: 0.3 lane widths
over 0.25 s.

## Non-goals

Intro leap and graffiti scene (CHS-2, 2d) · chaser art/animation (skins) · revive (M4) · hoverboard
protection (M4) · stumble sound.

## Acceptance

Claude: unit tests pass; browser at phone and PC sizes: chasers visible at run start then gone; swipe
into a train side → bounce + chasers close in → gone after ~3 s; second side bump while stumbling →
crash and catch; edge swipe → nudge + stumble; two edge swipes quickly → crash; no console errors.

Snehith: (1) the inspector and dog are there at the start and drop back; (2) bumping a train's side
brings them close for a few seconds; (3) a second bump while they're close ends the run and they grab
you; (4) swiping into the wall at the edge counts as a bump; (5) it still feels fair on phone and PC.
