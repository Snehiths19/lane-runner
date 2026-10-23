# Slice 3a — Power-ups (pickups, coin magnet, 2X): Design

Date: 2026-10-23 · Recommendations taken (Snehith accepts grill recommendations; listed for override).
See `CONTEXT.md`: Power-up, Coin magnet, 2X multiplier, Score multiplier. Covers PWR-1, PWR-4.

## Decisions (recommended)

1. **Split M3** into 3a (pickups + coin magnet + 2X + timers), 3b (super sneakers, jetpack, timer
   overlap), 3c (pogo stick, mystery box). The pickup system lands once, in 3a.
2. **Placement:** `p` in a section map is a power-up spot (a pickup cell like a coin, raised on roofs
   and ramps the same way). Which power-up it is is picked at random from the ones built so far.
   Five sections get a spot.
3. **Durations:** 10 s each before upgrades 🧪 (Subway Surfers: +5 s per upgrade up to 30 s; the base
   is to measure). Picking one up again restarts its timer. Upgrades come with the shop (M5).
4. **Coin magnet:** coins up to 15 m ahead (our call), any lane and height, fly into the runner over
   0.25 s and count when they arrive.
5. **2X:** doubles the score multiplier while active (HUD x1 → x2). Points now add up per metre run,
   so the 2X doubles only what's earned while it runs.
6. **Looks:** a pickup is a spinning flat badge with the power-up's icon (🧲 magnet, 2X); active
   power-ups show as icons with a shrinking bar at the bottom left.

## Numbers (baseline `powerUps`)

`magnet` { duration 10 🧪, range 15, pullTime 0.25 } · `double` { duration 10 🧪 }.

## Non-goals

Upgrades and shop (M5), sneakers/jetpack/pogo/mystery box (3b, 3c), power-up sounds.

## Acceptance

Claude: tests; browser at phone and PC sizes: pick up each power-up, magnet pulls coins from other
lanes, x2 shows and score rises twice as fast, timers shrink and end, no console errors.

Snehith: (1) power-ups show up on the track now and then; (2) the magnet pulls in coins from all lanes;
(3) 2X shows x2 and the score climbs faster; (4) the timers at the bottom left make sense.
