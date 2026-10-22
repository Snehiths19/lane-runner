# Lane Runner

A personal 3-lane endless runner built in the browser with Three.js. It first copies Subway Surfers
rule for rule, then gets personalized.
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
and ask for it to become a tweak. When the defaults change, each browser drops its old slider
values and shows "New default settings loaded".

## Changing the game to your taste

- **Subway Surfers' numbers** live in `src/rules/baseline.js` and stay untouched.
- **Your changes** live in `src/rules/tweaks.js`. They override the baseline, and deleting one goes
  back to the real Subway Surfers behavior.
- **What exists and what's next:** [`FEATURES.md`](FEATURES.md). Write what you want in its
  *Your tweak* column (plain words are fine) and ask Claude to apply it.

## Roadmap

Follows [`FEATURES.md`](FEATURES.md): M1 movement ✅ → M2 core loop (track, trains, hits, chase,
score) → M3 power-ups → M4 hoverboard, keys & revive → M5 progression & shop → M6 events & world →
personal additions (music, your face, friend events, San Jose).

## Development

- `npm test` — unit tests for the game rules (no install needed; uses Node's built-in runner).
- `npm run serve` — local server at http://localhost:8080.
- Glossary: `CONTEXT.md`. Decisions: `docs/adr/`. Design docs: `docs/superpowers/specs/`. Plans: `docs/superpowers/plans/`.

## Notes

- All code and assets are original or properly licensed; no assets taken from Subway Surfers.
- Ideas (not code) borrowed from [RohanChacko/Subway-Surfers](https://github.com/RohanChacko/Subway-Surfers) (MIT) and [Alpha-Rp/GEUS](https://github.com/Alpha-Rp/GEUS).
