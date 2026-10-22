# Lane Runner

A personal 3-lane endless runner that first copies Subway Surfers rule for rule (the **baseline**),
then gets personalized through **tweaks**, **skins** and **friend events**.

## Language

### The game

**Baseline**:
The game's rules and numbers as Subway Surfers has them, each with a source (official help, wiki, or measured from gameplay).
_Avoid_: defaults (ambiguous), original

**Tweak**:
A deliberate personal change to one baseline rule or number, kept separately so the baseline stays intact.
_Avoid_: mod, hack, override (in conversation)

**Feature checklist**:
The list of every Subway Surfers feature, its baseline numbers and source, its build status, and any tweak (`FEATURES.md`).

**Canvas**:
The base game (track, lanes, movement, camera, controls, tuning) that skins and events sit on.

**Skin**:
How things look and sound (character, music, setting); swapping a skin never changes the rules.
_Avoid_: theme (when it means rules)

**Run**:
One play from leaving the start screen until the crash screen (a revived crash doesn't end it).
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

**Train**:
The full-height obstacle: one or more train cars in a lane, parked or (later) moving toward the runner. Its front is a **head-on hit**; without a **ramp** it's passed by changing lanes; its roof can be run on.
_Avoid_: blocker, wall (walls and poles are separate kinds, later)

**Ramp**:
A slope at the near end of a train (the end the runner meets first) that lets the runner run up onto the roof.

### Scoring

**Distance**:
How far the current run has gone, in metres.

**Score**:
Points earned during a run: distance-based points times the score multiplier.
_Avoid_: points

**Score multiplier**:
The number score is multiplied by; raised permanently by completing missions (up to x30), and temporarily by pickups and boosters.

**Coin**:
A collectible on the track, also the currency spent on upgrades, hoverboards and items.

**Key**:
A rarer currency; mainly spent to revive after a crash, at a cost that doubles each time within a run.

**Revive**:
Continuing a crashed run by spending keys, offered right after a crash.
_Avoid_: save me (that's the button copy), continue

**Crash screen**:
The notebook-style card after a run ends: score, coins, best score ("New best!" when beaten), top runs, and PLAY; Menu and Boosts buttons join when those features exist.

**Top runs**:
The five best scores on this device, shown where Subway Surfers shows its friends leaderboard.
_Avoid_: leaderboard (that implies other players)

**Best score**:
The highest score reached on this device, shown on the crash screen.
_Avoid_: high score, best distance

### Hits

**Crash**:
The hit that stops the runner (a head-on hit or a second stumble); it ends the run unless revived.
_Avoid_: death, game over (as a term; fine as on-screen copy)

**Head-on hit**:
The runner's hitbox meeting an obstacle coming toward it in the runner's own lane. Always a crash.

**Side bump**:
The runner's hitbox meeting an obstacle while changing lanes into it from the side (e.g. swiping into a train they're running beside). The runner bounces back to the lane they left. From slice 2b it bounces only; the **stumble** penalty joins in slice 2c.

**Roof**:
The top of a train, a raised running surface. Leaving it (off the far end, or sideways into a lane without a train) drops the runner to the track; sideways onto a neighbouring train's roof keeps them up.

**Stumble**:
The warning state after a side bump, lasting a short window (Subway Surfers' length still to be measured; placeholder 3 s 🧪); a second side bump while stumbling is a crash. During it the **chasers** run right behind the runner, then drop back when it ends. No slowdown: the runner keeps full speed and control (baseline; Snehith chose this 2026-10-22).

**Chasers**:
The inspector and the dog who chase the runner (CHS-1). Placeholder looks: two flat cutouts drawn like the runner (a tall inspector, a small dog), shown behind the runner only when close; real art comes later as skins. On a **crash** they run up and grab the runner within the existing 1 s pause before the crash screen (the **catch**; baseline, Snehith chose this 2026-10-22). They start every run right behind the runner for the first couple of seconds, then drop back out of view (the 2d intro leap will later play before this).
_Avoid_: enemies, guards

**Section**:
A short hand-made stretch of track (a few seconds long) with obstacles and coins placed in lanes; runs are built by chaining sections in random order. Sections are original designs in Subway Surfers' style (same building blocks, spacing measured from its gameplay), never traced copies of its layouts.
_Avoid_: chunk, pattern, level

**Section map**:
The text picture a section is written as: one row per stretch of track, one column per lane, read from near (bottom) to far (top).
_Avoid_: level file, layout

**High coin**:
A coin at jump height above whatever is under it (track or roof), reached only by jumping (written `^`), typically arcing over a low barrier.

**Roof coin**:
A coin on a train's roof (written `Bc` in a section map), reached by running up the train's ramp.

**Friend event** (later):
A friend appearing mid-run doing something, sometimes giving a **power-up**.

## Relationships

- A **Run** moves through **run states**: start → running ⇄ paused → crashed → (revive → running) or crash screen → (tap) a new run. The title (start) screen only appears when the game is first opened.
- Every **obstacle**, coin and **friend event** sits in exactly one **lane** at a distance along the track.
- A **run** is an endless chain of **sections**; each **section** holds obstacles and coins (later also friend events).
- Each **obstacle** kind is beaten by one move: **low barrier** → jump, **overhead bar** → roll, **train** → lane change, or running up its **ramp** when it has one.

## Invariants

- **Ground height comes from one place.** Landing and collisions always ask for the ground height under the runner (by lane and distance); it is 0 everywhere until **trains** (slice 2b) add roofs. Nothing may assume y = 0 directly.
- **A ramp always leads onto a train**: it sits directly in front of a train in the same lane. A ramp leading nowhere is a mistake the checks reject.
- **Every section starts and ends with all three lanes clear**, so any two sections can follow each other without creating an impossible spot.
- **Placing is generic.** Whatever puts obstacles on the track must also be able to place coins and friend events.
- **Hitbox is separate from image.** Collisions never use image size.
- **The tap that leaves the start screen or crash screen never also moves the runner**, and crash-screen taps are ignored until it appears.
- **Baseline values are never edited to suit taste.** Taste goes in tweaks; the baseline only changes when better evidence about Subway Surfers arrives.
- **Best score and top runs are not tuning values.** They're stored apart from slider tweaks and survive a defaults reset.
- **A lane change remembers the lane it left**, so a side bump can bounce the runner back mid-switch.

## Example dialogue

> **Dev:** "If the **runner** is mid-jump when a **train** comes up in their **lane**, can they clear it?"
> **Snehith:** "No. A **train** is too tall to jump onto. Change **lane**, or if it has a **ramp**, run up the ramp onto the roof. Jumping is for **low barriers**."

## Flagged ambiguities

- Swiping past the edge of the track: baseline (Subway Surfers) counts it as a **side bump** into the wall, so it stumbles. Snehith first chose "harmless", then chose the baseline; if wanted later, it becomes a **tweak**.
- "crash" was first defined as the end of a run. Resolved: with **revive**, a **crash** is the stopping hit and the **run** ends at the **crash screen**.
- "score" was first used to mean distance. Resolved: **score** is distance-based points × **score multiplier**; **distance** is just metres.
- "blocker" and "train" were two terms for the same grey train car. Resolved (2026-10-22): one concept, **train**; a ramp makes it climbable. Non-train walls and poles are separate kinds, added later.
