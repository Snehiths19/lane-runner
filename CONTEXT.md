# Lane Runner

A personal, Subway Surfers-inspired 3-lane endless runner. The **canvas** is the base game; **skins**
and **friend events** personalize it.

## Language

### The game

**Canvas**:
The base game (track, lanes, movement, camera, controls, tuning) that skins and events sit on.

**Skin**:
How things look and sound (character, music, setting); swapping a skin never changes the rules.
_Avoid_: theme (when it means rules)

**Run**:
One play from leaving the start screen until a crash.
_Avoid_: game, round, session

**Run state**:
Where a run is: start, running, paused, or crashed. Movement and world time only advance while running.

**Lane**:
One of three fixed tracks the runner can be in: left, middle, right.

**Runner**:
The player's character, shown as a flat cutout that always faces the camera.
_Avoid_: player (in game copy), avatar

**Hitbox**:
The invisible box that counts for collisions, independent of the runner's or obstacle's image.

### Things on the track

**Obstacle**:
Something in a lane that ends or hurts a run if the runner's hitbox touches it.

**Low barrier**:
A knee-high obstacle passed by jumping over it.

**Overhead bar**:
A head-height obstacle passed by sliding under it.

**Blocker**:
A full-height obstacle passed only by changing lanes. A skin may draw it as a train car.
_Avoid_: train (trains you can stand on are a separate, later idea)

### Scoring

**Distance**:
How far the current run has gone, in metres; this is the score.
_Avoid_: score (as a separate number), points

**Coin**:
A collectible on the track; the run's coin count is shown beside distance and doesn't change the score (for now).

**Crash screen**:
What shows about 0.7 s after a crash: the run's distance and coins, best distance, and "New best!" when beaten.

**Best distance**:
The longest distance reached on this device, shown on the crash screen.
_Avoid_: high score

### Hits

**Crash**:
The end of a run, caused by a head-on hit or a second stumble.
_Avoid_: death, game over (as a term; fine as on-screen copy)

**Head-on hit**:
The runner's hitbox meeting an obstacle coming toward it in the runner's own lane. Always a crash.

**Side bump**:
The runner's hitbox meeting an obstacle while changing lanes into it from the side. The runner bounces back to the lane they left.

**Stumble**:
The warning state after a side bump, lasting 5 seconds; a second side bump while stumbling is a crash.

**Section**:
A short hand-made stretch of track (a few seconds long) with obstacles and coins placed in lanes; runs are built by chaining sections in random order.
_Avoid_: chunk, pattern, level

**Section map**:
The text picture a section is written as: one row per stretch of track, one column per lane, read from near (bottom) to far (top).
_Avoid_: level file, layout

**High coin**:
A coin at jump height, reached only by jumping (written `^`), typically arcing over a low barrier.

**Friend event** (later):
A friend appearing mid-run doing something, sometimes giving a **power-up**.

## Relationships

- A **Run** moves through **run states**: start → running ⇄ paused → crashed → (tap) a new run, running. The title (start) screen only appears when the game is first opened.
- Every **obstacle**, coin and **friend event** sits in exactly one **lane** at a distance along the track.
- A **run** is an endless chain of **sections**; each **section** holds obstacles and coins (later also friend events).
- Each **obstacle** kind is beaten by exactly one move: **low barrier** → jump, **overhead bar** → slide, **blocker** → lane change.

## Invariants

- **Ground is height 0.** The runner lands only at y = 0. Standing on trains (later) must replace this with "ground height under the runner", in movement rules and collisions alike.
- **Every section starts and ends with all three lanes clear**, so any two sections can follow each other without creating an impossible spot.
- **Placing is generic.** Whatever puts obstacles on the track must also be able to place coins and friend events.
- **Hitbox is separate from image.** Collisions never use image size.
- **The tap that leaves the start screen or crash screen never also moves the runner**, and crash-screen taps are ignored until it appears.
- **Best distance is not a tuning value.** It's stored apart from slider tweaks and survives a defaults reset.
- **A lane change remembers the lane it left**, so a side bump can bounce the runner back mid-switch.

## Example dialogue

> **Dev:** "If the **runner** is mid-jump when a **blocker** comes up in their **lane**, can they clear it?"
> **Snehith:** "No. A **blocker** is full height; only changing **lane** gets you past it. Jumping is for **low barriers**."

## Flagged ambiguities

- "side bump" does **not** include swiping past the edge of the track: that is harmless and ignored (a deliberate difference from Subway Surfers).
- "train" could mean a **blocker** drawn as a train car or a train you can run on top of. Resolved: step 2 has **blockers** only; rideable trains come later.
