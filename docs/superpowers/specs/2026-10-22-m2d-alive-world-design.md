# Slice 2d — Alive world: Design

Date: 2026-10-22 · Decided in the claude.ai project thread. Snehith accepts the recommended answers in
grills, so these are the recommendations, listed for him to override (see `CONTEXT.md`: Moving train,
Speed ramp, Intro leap, Tunnel). Covers FEATURES.md TRK-6, TRK-9, MOV-6, CHS-2, CAM-1 (jump and sideways).

## Decisions (recommended, 2026-10-22)

1. **Moving trains** come toward you at a placeholder 10 m/s 🧪, written `M` in sections. They never
   have ramps (like Subway Surfers, where only parked trains have ramps), and their lane stays empty in
   the rest of their section, so they meet the runner where the map shows. Two new sections use them.
2. **Speed ramp:** speed rises evenly by 60% over the first 150 s, then stays there (both 🧪, to measure
   from Poki). It multiplies Snehith's run speed tweak, so it starts at 20 and caps at 32.
3. **Intro leap:** every run opens with one automatic high leap (5 m, above the 3.6 m roof) over a
   one-car moving train in the middle lane; swipes are ignored and nothing can be hit until landing.
   The graffiti scene is skipped until real art exists. The chasers are close during it (2c start chase).
4. **Tunnels** are looks only: a dark covered stretch (60 m long, every 400 m, our calls) with side walls
   outside the lanes and a high ceiling (8.5 m) so the camera stays inside even on roofs.
5. **Camera:** lifts with the runner by 40% of the jump height 🧪 and slides sideways with a short lag
   (0.12 s 🧪), then settles; surface follow stays as in 2b.

## Goals

1. `M` in section maps → train items with `speed`; `R` in front of `M` is rejected; anything in an `M`
   lane above the `M` rows is rejected (names the section and line).
2. Track places a moving train shifted forward by `(mapStart − distance) × trainSpeed / runSpeed` and
   moves it each frame (`track.move(dt)`); hits classify head-on vs side bump using where the train's
   front was last frame, so a fast oncoming front is never misread as a side bump.
3. `speedAt(time, runSpeed, speedRamp)`; the game keeps run time; the world scrolls at the actual speed.
4. Intro: `startIntro(player, cfg, height)`, `introTrain(...)` timed so the car passes under while the
   runner is above roof height; hits are skipped while `player.intro`.
5. `tunnelsBetween(from, to, rules)` (pure) feeds the world's tunnel meshes.
6. `followCamera(cam, target, dt, rules)` (pure, frame-rate independent) for lift and sideways lag.

## Numbers (baseline, our calls unless 🧪)

`track.trainSpeed` 10 🧪 · `speedRamp` { rampTime 150 🧪, maxBoost 0.6 🧪 } · `intro.leapHeight` 5 ·
`track.tunnel` { every 400, length 60, height 8.5 } · `camera` { jumpFollow 0.4 🧪, sideLag 0.12 🧪, liftLag 0.15 }.

## Non-goals

Graffiti scene (waits for art) · moving trains on a curve or changing lanes · tunnel lighting · sounds.

## Acceptance

Claude: unit tests pass; browser at phone and PC sizes: intro leap clears the train; a moving train
approaches and crashes head-on, side bump still bounces; speed visibly higher after a while; a tunnel
passes; camera rises on jumps and lags on lane changes; no console errors.

Snehith: (1) the run opens with a leap over a train; (2) some trains drive at you and feel fair to dodge;
(3) the game gets faster the longer you run; (4) tunnels pass by; (5) the camera feels alive on jumps
and lane changes without making you dizzy.
