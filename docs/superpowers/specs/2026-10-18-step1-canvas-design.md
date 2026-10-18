# Step 1 — The Canvas: Design

Date: 2026-10-18 · Status: awaiting approval

## Intent

Lane Runner is Snehith's personal, Subway Surfers-inspired 3-lane endless runner. What makes it
personal is mostly **skin**: his own character, his music, and later his face, friends popping in,
and a San Jose setting. Those come one at a time, later. Step 1 builds the **canvas**: the base game
everything else sits on. It has to feel right and be ready for those skins and events without a rewrite.

Snehith is not a coder. Claude builds and verifies everything. Snehith judges feel and makes the
gameplay and look decisions.

## Terms

- **Canvas**: the base game: track, lanes, movement, camera, controls, sliders (roadmap steps 1–3).
- **Skin**: how things look and sound (character, music, setting). Swapping a skin never changes rules.
- **Friend event** (later): a friend appearing mid-run doing something, sometimes giving a **power-up**.
- **Phone layout / PC layout**: decided by **screen width** (under ~700px = phone layout), not by device type.

## Goals (step 1)

1. A start screen ("Tap / press Space to run"). The tap or key that leaves it does **not** also jump.
2. An endless straight track with 3 lanes that scrolls forward. No obstacles yet, so the run never ends.
3. Movement with Subway Surfers defaults:
   - Lane switch left/right, allowed **mid-air** and **mid-switch** (redirects smoothly).
   - Jump only from the ground. Jumping cancels a slide.
   - Slide on the ground. **Swipe down mid-air = fast drop, then slide on landing.**
4. Controls: keyboard (arrows / WASD / Space) and swipe (fires as soon as the finger passes the
   threshold, one action per swipe). The mouse can drag-swipe too.
5. Tuning panel with sliders: run speed, lane width, lane-switch time, jump height, gravity,
   slide time, fast-fall speed. Changes apply instantly.
   - ⚙️ button in a corner. **Phone layout:** the panel slides over the game **and pauses it**.
     **PC layout:** a side bar, and the game keeps running.
   - **Copy settings** button: copies the current values as one line of text for Snehith to paste
     to Claude, who then makes them the repo defaults.
   - **Reset to defaults** button.
6. A distance counter at the top edge.

## Decided rules (invariants)

- **Art style is flat cutouts in a 3D world.** Characters are flat images that always face the
  camera. Step 1 uses a placeholder cutout (a simple drawn figure or colored card), not a 3D box.
- **What a character looks like is separate from what counts as a hit.** Every character has an invisible
  hitbox that is independent of image size. Sliding swaps to a "ducking" image (in step 1: squashes
  the placeholder) and shrinks the hitbox.
- **The camera always stays behind the runner.** It may shift sideways a little to follow lane
  changes. It never orbits or shows a side view (cutouts would look flat).
- **The view is sized by width.** On narrow upright screens the camera widens until all 3 lanes plus
  a margin fit. On wide screens the lanes keep their size and more side scenery shows.
  Lanes are never cropped on any screen.
- **Nothing permanent on screen covers the track on a phone.** HUD on the top edge only; everything
  else can be hidden.
- **Game states:** Start → Running ⇄ Paused (Crashed arrives in step 2). Movement and world time
  only advance while Running. While Paused, nothing moves and swipes and keys don't control the
  runner. Every feature declares which states it works in.
- **Touches on the panel never count as game swipes.**
- **Repo defaults are the official values.** A browser keeps its saved slider tweaks only while
  the defaults they were saved against are unchanged. The game builds a fingerprint from the default values. If
  the fingerprint changes, saved tweaks are discarded and a brief notice shows
  ("New default settings loaded"). Saving must fail quietly when browser storage is blocked.
- **The world moves, not the player.** The runner stays at a fixed depth and track pieces scroll
  toward the camera and are recycled. Whatever gets placed on the track later (obstacles, coins,
  friend events) rides on that scrolling world, so step 2's placing system must be generic
  ("a thing in a lane at a distance"), not obstacle-only.

## Non-goals (step 1)

Obstacles, coins, crashing, score beyond distance, speed ramp, sound/music, real character art,
menus, a pause button (the ⚙️ panel is the only pause for now), polishing for sideways phones
(they must still work).

## Anti-goals

- Using any Subway Surfers asset or the name in the game.
- Anything that needs a build step, an install, or a server: it must open from GitHub Pages as-is.
- Controls that feel laggy: actions must respond on the frame they're received.

## Constraints

- Plain HTML/CSS/JavaScript modules plus Three.js loaded from a CDN at a pinned exact version. No bundler.
- Hosted on GitHub Pages from `Snehiths19/lane-runner` (public), branch `main`, root folder.
- Movement rules live in a module with no Three.js dependency, unit-tested with Node's built-in
  test runner (`node --test`), so they can be checked without a browser.
- Work continues from any device via claude.ai/code, so everything needed is in the repo.

## Acceptance

Claude: unit tests pass; the game is run in a browser at phone (~390×844) and PC (~1440×900) sizes,
played, and screenshotted.

Snehith, on his real phone and PC from the live link:
1. Start screen appears; tap/Space starts the run.
2. The track scrolls forward endlessly; all 3 lanes are visible upright on the phone.
3. Swipe/arrows change lanes, including in mid-air.
4. Swipe up/Space jumps; swipe down slides; swiping down mid-air drops fast into a slide.
5. ⚙️ opens the sliders (pausing on the phone), changes are felt right away, and Copy settings copies text.
6. Reloading the page keeps tweaks.

## Claude's calls (check these)

- Default values (from the draft): speed 12, lane width 2.5, switch 0.12s, jump height 2.2,
  gravity 45 (≈0.63s air time), slide 0.6s, fast-fall 30. Tuned by feel later.
- Swipe threshold 30px, not a slider.
- Placeholder world: plain grey track with rails and cross ties (so motion is visible), simple
  side blocks for a sense of speed, sky color with fog.
- Lane switch eases out (fast start, soft stop).
- Swiping into the edge of the track does nothing in step 1 (Subway Surfers' "stumble" comes later).
- Three.js pinned to 0.160.0 via jsDelivr.
- A soft round shadow under the runner that shrinks with height (cheap, helps judge jumps).
- Switching tabs or locking the phone freezes the world (no catch-up jump in time when you return).
  A full auto-pause comes with the pause button later.
- If the browser blocks clipboard access, Copy settings shows the text in a box to copy by hand.

## Left to the builder

File layout, render details, exact panel styling, and how the fingerprint is computed.
