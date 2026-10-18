# Lane Runner

A personal 3-lane endless runner inspired by Subway Surfers, built in the browser with Three.js.
Runs on PC (keyboard) and phone (swipe). No install needed — open the hosted page and play.

**Play:** https://snehiths19.github.io/lane-runner/

## Controls

| Move | PC | Phone |
|---|---|---|
| Change lane | ← → or A D | Swipe left / right (works mid-air too) |
| Jump | ↑, W or Space | Swipe up |
| Slide | ↓ or S | Swipe down (mid-air: drop fast, then slide) |

## Tuning the feel

Tap ⚙️ to open the sliders (on a phone the run pauses while it's open). Changes apply instantly
and are remembered in that browser.

To make a tuning **permanent on every device**: press **Copy settings**, paste the text to Claude,
and ask for it to become the defaults. When the defaults change, each browser drops its old
tweaks and shows "New default settings loaded".

## Roadmap

1. **Core movement** ✅ — endless track, 3 lanes, lane switch / jump / slide, tuning sliders.
2. **Obstacles & coins** — collisions, crash/restart, score.
3. **Difficulty** — speed ramps up over time, obstacle patterns.
4. **Personalization** — your own character, music, then faces, friend events, San Jose setting.
5. **Polish & publish** — sounds, effects, menus.

## Development

- `npm test` — unit tests for the game rules (no install needed; uses Node's built-in runner).
- `npm run serve` — local server at http://localhost:8080.
- Design docs: `docs/superpowers/specs/`. Plans: `docs/superpowers/plans/`.

## Notes

- All code and assets are original or properly licensed; no assets taken from Subway Surfers.
- Ideas (not code) borrowed from [RohanChacko/Subway-Surfers](https://github.com/RohanChacko/Subway-Surfers) (MIT) and [Alpha-Rp/GEUS](https://github.com/Alpha-Rp/GEUS).
