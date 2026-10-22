# Project history & context

Everything decided in the original conversation (2026-10-18 → 2026-10-22) that isn't obvious from the
code, so a new session can continue without it. Current state and next steps: `STATUS.md`. Terms and
rules: `CONTEXT.md`. Formal decisions: `docs/adr/`. Per-slice designs: `docs/superpowers/specs/`.

## About the owner and how to work with him

- **Snehith is not a coder.** Claude writes, tests and verifies all code. Snehith decides gameplay,
  checks feel on his phone and PC, and answers design questions.
- Ask **one question at a time**, in plain language, each with a recommendation and its tradeoff.
  Offer short option lists only when a choice needs comparing. Don't explain process jargon.
- He wants to **work from any device** (desktop terminal, desktop app, claude.ai project on the
  phone), so everything lives in this public repo and is **pushed after every commit**.
- Preferred process, every slice: `/grill-with-docs` → design doc → plan (writing-plans) → `/tdd`
  (one test → one implementation) → browser check at phone + PC sizes → publish → short acceptance
  checklist. Decide each slice just before building it.
- He plays on **both**: phone held **upright** (swipe), PC **wide** (keyboard).
- He accepts or adjusts by playing; e.g. after step 1 he only asked for run speed 20.

## How the goal evolved

1. **Start (10-18):** "a personalized Subway Surfers that's playable and modifiable", built step by
   step, not in one shot. First question: could [REA](https://github.com/morluto/rea) (an MCP for
   reverse engineering) extract the real game?
2. **Reverse engineering rejected.** Subway Surfers is a Unity IL2CPP game: logic is compiled into a
   stripped native library, and names live in a separate metadata file. REA has no Unity/IL2CPP mode;
   Il2CppDumper gives names, not logic; AssetRipper gives assets but empty scripts; a Unity MCP builds
   *new* Unity games and reverse-engineers nothing. Modifying the real APK is impractical, can't be
   hosted publicly, and modded APKs are a malware risk. REA stays available for one narrow,
   undocumented "how do they do that?" question if it ever matters.
3. **Existing clones checked:** RohanChacko/Subway-Surfers (MIT, 2019 raw WebGL, finish line, breaks
   in Chrome) and Alpha-Rp/GEUS (Three.js, no licence). Only ideas borrowed; built fresh.
4. **Tech:** Three.js in the browser, no build step, GitHub Pages (public repo so hosting is free).
5. **Goal change (10-21):** "make it **exactly** like Subway Surfers with all its features first, then
   tweak it to my taste." This produced the **baseline / tweaks** split (ADR 0002), `FEATURES.md`
   (researched feature checklist, the roadmap), and reversed three earlier personal choices back to
   Subway behaviour (edge swipe stumbles, score × multiplier, revive with keys).
6. **Personalization later** (his words): his own character and music, later his face, friends popping
   in randomly doing things (some giving power-ups), maybe a San Jose setting, "one by one".

## Decisions by session

### Step 1 · canvas (grill-me, 10-18)
- "Personalized" = mainly **looks** first; rules later (friend events).
- Art: **flat cutout characters in a 3D world**: faces and friends become photo swaps. Hitbox is
  separate from the image; the camera always stays behind the runner.
- Phone **upright**, PC **wide**; the view is sized by width so the 3 lanes never crop.
- Tuning panel: ⚙️; on phones it **pauses** the run (bottom sheet), on PC it's a **side bar**.
- Slider tweaks saved per browser; **Copy settings** → paste to Claude → made permanent in the repo;
  a defaults fingerprint auto-resets stale tweaks with a notice.
- **Start screen** (needed so music can play from the first tap later).
- Mid-air moves use Subway defaults (lane change in the air; swipe down = fast drop into a roll).
- After playing: run speed 12 → **20** (now his only tweak).

### Research & measurement (10-21 / 10-22)
- Sources: SYBO's official help center (most authoritative), Wikipedia, the fan wiki (it blocks
  automated reading, so read via search results), guide sites (low confidence). See `FEATURES.md`.
- He suggested playing a web version; we used the **official** Poki version (by SYBO), not clones.
  Measured: jump air time ≈ 0.7 s → **baseline gravity 36** (he approved), lane switch ≈ 0.15–0.2 s
  (rough), ≈ 14.6 points/s at x1, camera follows the runner, run intro leap. Method: `tools/measure/`.

### M2 re-plan (grill-with-docs, 10-22)
- Split M2 into playable slices: **2a** dodge & crash → **2b** trains → **2c** chase → **2d** alive
  world; revive waits for keys (M4).
- **Sections are original** designs in Subway Surfers' style (spacing measured from its gameplay),
  never traced copies (ADR 0001 update).
- Crash card copies Subway's notebook layout; its friends leaderboard becomes **top runs** (5 best on
  this device). Ads are never included.
- Absolute run speed can't be measured (perspective), so baseline speed stays a labelled placeholder.

### Slice 2a · dodge & crash (built, accepted)
Low barrier / overhead bar / train-without-ramp, coins and high coins, head-on crash, Subway-style
HUD (score + x1 top-right, ⚙️ top-left), hit flash, crash card after ~1 s, best score and top runs.

### Slice 2b · trains (grill-with-docs, built, accepted)
- "Blocker" and "train" merged: **one train concept**; a **ramp** makes it climbable.
- Section notation: `R` ramp, `Bc` roof coin, `B^` high coin above a roof, `Rc` ramp coin.
- Roofs: run, jump, roll; drop off the end or sideways; hop to a neighbouring roof.
- **Side bump bounces back** already in 2b (stumble penalty comes in 2c).
- Camera follows **surface height** now; jump lift and sideways follow in 2d.

## Ideas parked for later

- Friend events and power-ups from friends; his face on the runner; San Jose as a World Tour city;
  his own music (needs the start screen tap, already in place).
- Real art via skins; sounds come with music.
- `sections.txt` is meant to be editable by Snehith himself on GitHub.

## Not doing (with reasons)

Ads, real-money shop, Facebook login, crews, online leaderboards (personal game, no server);
copying Subway Surfers' art, characters, music, name or exact track layouts (not ours to copy).
