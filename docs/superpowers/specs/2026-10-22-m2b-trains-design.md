# Slice 2b — Trains: Design

Date: 2026-10-22 · Decided in a grill-with-docs session (see `CONTEXT.md`: Train, Ramp, Roof, Roof coin,
Side bump). Covers FEATURES.md TRK-4/5/7/8, HIT-2 (bounce only), CAM-1 (surface follow only).

## Intent

Make the track feel like Subway Surfers: the full-height obstacles are **trains**; a **ramp** at a
train's near end lets the runner run up onto its **roof**, collect **roof coins**, hop between
neighbouring roofs and drop back down. Swiping into a train's side **bounces back** instead of crashing.

## Goals

1. **One train concept.** `B` = train car (stacked `B` rows = one long train). The old "blocker" is
   gone everywhere (code names, legend, docs); behaviour of rampless trains is unchanged.
2. **Section notation.** `R` = ramp, placed in the row directly in front of a train in the same lane;
   a ramp not followed by a train is rejected. `Bc` = roof coin, `B^` = high coin above the roof,
   `Rc` = coin on the ramp. `R` can't combine with an obstacle.
3. **Surfaces.** The ground height under the runner is: roof height on a train, rising linearly along a
   ramp, else 0 (CONTEXT: ground height comes from one place). The lane used is the one nearest the
   runner's x, so stepping sideways off a roof drops the runner and stepping onto a neighbouring roof
   doesn't.
4. **Movement on surfaces.** While grounded the runner follows the surface up (ramps). When the surface
   drops away (end of a train, sideways off a roof) the runner falls with normal gravity; rolling in
   mid-air still fast-falls. Jumping and rolling work on roofs.
5. **Hits.** A train's front is a head-on crash for a runner below its roof; a runner on the roof is
   safe. Ramps are surfaces, never obstacles. A **side bump** (moving sideways into an obstacle that
   was already alongside) bounces the runner back to the lane they left; no stumble until slice 2c.
6. **Camera.** Rises and falls smoothly with the surface height (ground ↔ roof). Jump lift and sideways
   follow stay in slice 2d.
7. **Sections.** Four new train sections: ramp + roof coin trail; two side-by-side trains for roof
   hopping; a long rampless train to go around; a ramp leading into a roll-under.

## Numbers (our calls, tuned by playtest)

Roof height 3.6 m (out of jump reach: jump peak 2.2 m). Ramp length = one row (5 m). Roof coins sit at
the same heights above the roof as ground coins above the track. Camera surface follow eases over
~0.25 s.

## Non-goals

Stumble penalty, edge-swipe stumble, inspector & dog (2c) · moving trains, tunnels, jump camera lift,
speed ramp (2d) · super sneakers jumping onto roofs (M3).

## Acceptance

Claude: unit tests pass; browser at phone and PC sizes: run up a ramp onto a roof, collect roof coins,
hop to a neighbouring roof, drop off the end, bounce back when swiping into a train's side, crash
head-on into a train front; camera keeps the runner on screen on roofs; screenshots.

Snehith: (1) ramps take you up and roofs feel right; (2) roof coins and hopping between roofs work;
(3) swiping into a train's side bounces you back; (4) running into a train's front still crashes;
(5) the camera keeps you in view on roofs.
