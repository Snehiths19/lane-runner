# Step 1 — The Canvas: Implementation Plan

> **For agentic workers:** Execute natively in this session with the `tdd` skill (red-green-refactor),
> as chosen by Snehith. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A playable endless 3-lane track with Subway Surfers-style lane switch / jump / slide,
keyboard + swipe controls, a start screen, and a tuning panel — hosted on GitHub Pages.

**Architecture:** Pure-logic ES modules (config, tuning, player, game state, input classification,
camera fit) with no DOM or Three.js imports, unit-tested by `node --test`. Thin browser modules
(world, panel, main) wire them to Three.js and the DOM and are verified by playing in a browser.
The world scrolls toward a runner fixed at depth 0.

**Tech Stack:** HTML/CSS, JavaScript ES modules, Three.js 0.160.0 from jsDelivr via import map,
Node 24 `node:test` + `node:assert/strict`.

**Spec:** `docs/superpowers/specs/2026-10-18-step1-canvas-design.md`

## Global Constraints

- No build step, no install needed to play; opens from GitHub Pages as-is.
- Three.js pinned: `https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js`.
- No Subway Surfers assets or name in the game.
- Phone layout = viewport width < 700px; otherwise PC layout.
- Movement and world time advance only in state `running`.
- Defaults: runSpeed 12, laneWidth 2.5, laneSwitchTime 0.12, jumpHeight 2.2, gravity 45,
  slideTime 0.6, fastFallSpeed 30. Swipe threshold 30px.
- Storage key `lane-runner.tuning`; all storage access wrapped so blocked storage never breaks the game.
- Lanes are 0 (left), 1 (middle), 2 (right); lane x = `(lane - 1) * laneWidth`.

## Review Focus

1. **Rapid swipes mid-switch** (left then right within 0.05s) — runner must not teleport; x is continuous. → Task 2 test `redirect mid-switch starts from current x`.
2. **Tab hidden / phone locked for minutes** — on return the runner must not jump through time. → Task 3 test `clampDt caps large frame gaps`.
3. **Corrupt or blocked storage** (bad JSON, `getItem` throws, a non-number value) — game loads with defaults, no crash. → Task 4 tests.
4. **The tap that leaves the start screen** — must not also jump. → Task 3 test `start does not produce a control action`; Task 7 wiring routes the first action to `start` only.
5. **Extreme slider values** (laneSwitchTime 0.04, gravity 10 with jumpHeight 5) — still lands, still reaches the lane. → Task 2 test `extreme tuning still lands and reaches lane`.

---

## File Structure

| File | Responsibility |
|---|---|
| `package.json` | `"type": "module"`, scripts `test` (`node --test`), `serve` (`npx --yes http-server -c-1 -p 8080 .`) |
| `src/config.js` | `DEFAULTS`, `TUNING_RANGES`, `defaultsFingerprint()` |
| `src/tuning.js` | Load/save tweaks against the fingerprint; settings text for Copy |
| `src/player.js` | Movement rules + hitbox (draft exists — reuse) |
| `src/game-state.js` | start / running / paused state + `clampDt` |
| `src/input.js` | `classifySwipe` (pure) + `attachInput` (DOM) (draft exists — refactor) |
| `src/view.js` | `fovForAspect` camera-fit math |
| `src/world.js` | Three.js scene: track tiles, rails, ties, side blocks, runner cutout, shadow, camera |
| `src/panel.js` | Tuning panel DOM (draft exists — rework onto `tuning.js`) |
| `src/main.js` | Wiring + animation loop |
| `index.html`, `styles.css` | Page, import map, HUD, start screen, ⚙️, panel, notice |
| `tests/*.test.js` | One test file per pure module |

---

### Task 1: Tooling, config and defaults fingerprint

**Files:** Create `package.json`, `tests/config.test.js`. Modify `src/config.js` (draft).

**Interfaces — Produces:** `DEFAULTS` (object of the 7 numbers), `TUNING_RANGES` (`key → [min, max, step, label]`), `defaultsFingerprint(defaults: object) → string`.

- [ ] **Step 1: Write failing tests** in `tests/config.test.js`:
  - `every default has a range and sits inside it` — keys of `TUNING_RANGES` equal keys of `DEFAULTS`; each `min <= DEFAULTS[k] <= max`.
  - `fingerprint is stable` — `defaultsFingerprint({...DEFAULTS}) === defaultsFingerprint(DEFAULTS)`.
  - `fingerprint changes when any value changes` — for each key, bumping it by its step yields a different fingerprint.
  - `fingerprint ignores key order` — reversed-key copy gives the same fingerprint.
- [ ] **Step 2:** `npm test` → FAIL (`defaultsFingerprint` not exported).
- [ ] **Step 3:** Implement `defaultsFingerprint` in `src/config.js`: JSON of entries sorted by key (a string is fine; no hashing needed).
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat: config defaults and fingerprint`.

### Task 2: Player movement rules and hitbox

**Files:** Modify `src/player.js` (draft). Create `tests/player.test.js`.

**Interfaces — Consumes:** `DEFAULTS`. **Produces:** `createPlayer()`, `laneX(lane, cfg)`, `jumpVelocity(height, gravity)`, `handleAction(p, action, cfg)` with action `'left'|'right'|'jump'|'slide'`, `updatePlayer(p, dt, cfg)`, `isSliding(p)`, `hitbox(p) → { width: number, height: number }` — width 0.8; height 1.6 standing, 0.8 sliding.

Helper in the test: `step(p, seconds, cfg)` runs `updatePlayer` at dt = 1/60.

- [ ] **Step 1: Write failing tests:**
  - `starts in middle lane on the ground` — lane 1, x 0, y 0, grounded.
  - `lane switch reaches target in laneSwitchTime` — after `'left'` and 0.12s, x === −2.5.
  - `cannot leave the track` — `'left'` twice from lane 1 → lane 0; third `'left'` keeps lane 0.
  - `redirect mid-switch starts from current x` — `'left'`, step 0.05s, record x; `'right'` → x right after is the recorded x (no jump), ends at 0.
  - `jump peaks at jumpHeight` — max y over the jump is within 0.05 of 2.2; lands grounded after ≈ `2*v/g` (±0.05s).
  - `no double jump` — `'jump'` mid-air leaves vy unchanged.
  - `lane switch allowed mid-air` — jump, then `'right'` mid-air → lane 2 and x reaches 2.5 while still airborne.
  - `slide lasts slideTime` — sliding true at 0.5s, false at 0.65s.
  - `jump cancels slide` — slide then jump → `isSliding` false.
  - `swipe down mid-air fast-falls then slides on landing` — after `'slide'` mid-air, vy <= −30; on landing `isSliding` true.
  - `hitbox shrinks while sliding` — 1.6 standing, 0.8 sliding, width 0.8 both.
  - `extreme tuning still lands and reaches lane` — cfg with laneSwitchTime 0.04, gravity 10, jumpHeight 5: lands within 3s; lane switch reaches target.
- [ ] **Step 2:** `npm test` → only `hitbox` fails (draft covers the rest; any other failure is a draft bug to fix).
- [ ] **Step 3:** Add `hitbox(p)`; fix any draft bugs the tests reveal.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat: player movement rules and hitbox`.

### Task 3: Game state

**Files:** Create `src/game-state.js`, `tests/game-state.test.js`.

**Interfaces — Produces:** `createGame() → { state: 'start'|'running'|'paused', distance: number }`, `startRun(g)`, `setPaused(g, paused: boolean)`, `routeAction(g, action) → action | null` (returns the action only while running; while `start`, calls `startRun` and returns `null`), `advance(g, dt, speed) → dt` (adds `speed*dt` to distance and returns dt while running, returns 0 otherwise), `clampDt(dt) → number` (max 0.05s).

- [ ] **Step 1: Write failing tests:**
  - `begins on start screen` — state `'start'`, distance 0.
  - `start does not produce a control action` — `routeAction(g,'jump')` from start → `null`, state `'running'`.
  - `running passes actions through` — returns `'left'`.
  - `paused blocks actions and time` — after `setPaused(g,true)`: `routeAction` → null; `advance(g,0.016,12)` → 0, distance unchanged.
  - `unpause resumes` — `setPaused(g,false)` → `'running'`.
  - `pausing from start keeps start` — `setPaused(g,true)` then `setPaused(g,false)` while on start screen → `'start'`.
  - `distance accumulates while running` — 1s at speed 12 → 12.
  - `clampDt caps large frame gaps` — `clampDt(30) === 0.05`, `clampDt(0.016) === 0.016`.
- [ ] **Step 2:** `npm test` → FAIL (module missing).
- [ ] **Step 3:** Implement. Track the pre-pause state so unpausing returns to it.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat: game state machine`.

### Task 4: Tuning persistence

**Files:** Create `src/tuning.js`, `tests/tuning.test.js`.

**Interfaces — Consumes:** `DEFAULTS`, `defaultsFingerprint`. **Produces:** `loadTuning(storage) → { cfg: object, resetNotice: boolean }`, `saveTuning(storage, cfg)`, `settingsText(cfg) → string` (JSON of the 7 values, one line), `STORAGE_KEY = 'lane-runner.tuning'`. Stored shape: `{ fingerprint, values }`. `storage` is any `{ getItem, setItem }`; the browser passes `localStorage` (or `null` if accessing it throws).

- [ ] **Step 1: Write failing tests** (fake storage = object wrapping a Map):
  - `no saved data gives defaults, no notice`.
  - `saved tweaks load when fingerprint matches` — save runSpeed 20 → load gives 20, `resetNotice` false.
  - `stale fingerprint discards tweaks and sets notice` — stored with fingerprint `'old'` → defaults, `resetNotice` true, and storage now holds the current fingerprint (notice shows once).
  - `corrupt JSON gives defaults, no crash`.
  - `getItem throwing gives defaults` / `setItem throwing is ignored`.
  - `null storage works` — load gives defaults; save does nothing.
  - `non-number values are ignored` — `runSpeed: "fast"` → 12.
  - `settingsText round-trips` — `JSON.parse(settingsText(cfg))` deep-equals the 7 values.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat: tuning persistence with defaults fingerprint`.

### Task 5: Input

**Files:** Modify `src/input.js` (draft). Create `tests/input.test.js`.

**Interfaces — Produces:** `classifySwipe(dx, dy, threshold = 30) → 'left'|'right'|'jump'|'slide'|null` (screen y grows downward), `keyToAction(code) → action|null` (arrows, WASD, Space), `attachInput(surface: Element, onAction: (action) => void)`.

- [ ] **Step 1: Write failing tests** for the pure parts:
  - `below threshold is not a swipe` — (20, 10) → null.
  - `horizontal swipes` — (−40, 10) → left; (40, −10) → right.
  - `vertical swipes` — (5, −40) → jump; (5, 40) → slide.
  - `keys map` — ArrowLeft/KeyA→left, ArrowRight/KeyD→right, ArrowUp/KeyW/Space→jump, ArrowDown/KeyS→slide, KeyQ→null.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Extract the two pure functions; `attachInput` uses them. Pointer listeners go on the game canvas only (so panel touches never swipe). Ignore keys whose target is an `INPUT` or `BUTTON`, and ignore key repeats.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat: keyboard and swipe input`.

### Task 6: Camera fit

**Files:** Create `src/view.js`, `tests/view.test.js`.

**Interfaces — Produces:** `fovForAspect(aspect, { baseFov = 60, minHorizontalFov = 62 } = {}) → number` (vertical FOV in degrees): `max(baseFov, 2·atan(tan(minHorizontalFov/2) / aspect))` in degrees, capped at 100.

- [ ] **Step 1: Write failing tests:**
  - `wide screens use base fov` — aspect 16/9 → 60.
  - `upright phone widens fov` — aspect 390/844 → > 60, and its horizontal FOV ≥ 62 (within 0.01).
  - `extremely narrow is capped` — aspect 0.2 → 100.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat: width-based camera fit`.

### Task 7: World rendering, start screen and game loop (browser)

**Files:** Create `src/world.js`, `src/main.js`, `styles.css`. Replace `index.html`.

**Interfaces — Consumes:** everything above. **Produces:** `createWorld(canvas) → { update(dt, player, cfg), resize(width, height) }`.

- [ ] **Step 1:** `index.html`: import map for `three`; `<canvas id="game">`; HUD `#distance` at the top edge; `#start` overlay (title "Lane Runner", "Tap / press Space to run"); `#notice` toast; ⚙️ `#gear` button; `#panel` container. `canvas { touch-action: none }`.
- [ ] **Step 2:** `world.js`: sky color + fog; a set of track tiles (length 20) each with a grey bed, 4 rails, cross ties, random-height side blocks; tiles move `+z` by the scrolled distance each frame and wrap to the back. Runner = placeholder cutout (`PlaneGeometry` with a canvas-drawn simple figure texture, transparent, always facing the camera), height 1.6, bottom on the ground; slide squashes it to 0.5 height. Soft circular shadow that shrinks with height. Camera behind and above (≈ y 4.5, z 7, looking ahead), follows the runner's x at 0.5×; FOV from `fovForAspect`.
- [ ] **Step 3:** `main.js`: create game/player/tuning; `attachInput(canvas, a => { const r = routeAction(game, a); if (r) handleAction(player, r, cfg); })`; the start overlay's click and Space also route through `routeAction`. Loop: `dt = clampDt(...)`; `advance` → `updatePlayer` with the returned dt; `world.update`; distance HUD in metres (integer). Resize on `resize`.
- [ ] **Step 4:** Verify: `npm test` PASS; `npm run serve` in the background; in Playwright at 390×844 and 1440×900: start screen shows; Space/tap starts; screenshot all 3 lanes visible; press left, jump, slide and screenshot each; console has no errors.
- [ ] **Step 5:** Commit `feat: world rendering, start screen and loop`.

### Task 8: Tuning panel (browser)

**Files:** Modify `src/panel.js` (draft), `src/main.js`, `styles.css`.

**Interfaces — Consumes:** `TUNING_RANGES`, `loadTuning`, `saveTuning`, `settingsText`, `setPaused`. **Produces:** `buildPanel(container, cfg, { onChange, onCopy })`.

- [ ] **Step 1:** Rework the draft: build labels with `textContent` (not `innerHTML`); sliders write into the live `cfg` and call `saveTuning`; **Reset to defaults**; **Copy settings** uses `navigator.clipboard.writeText(settingsText(cfg))`, and if that fails, shows the text in a read-only `<textarea>` that's selected for manual copy.
- [ ] **Step 2:** Layout: ⚙️ toggles the panel. Width < 700px: panel overlays the game and `setPaused(game, open)`. ≥ 700px: right side bar, game keeps running; the track canvas shrinks to the remaining width (lanes stay uncropped).
- [ ] **Step 3:** On load, if `loadTuning` returns `resetNotice`, show `#notice` "New default settings loaded" for 3s.
- [ ] **Step 4:** Verify in Playwright: phone size — open panel → state paused (distance stops), drag the run-speed slider, close → resumes faster, no lane change from the drag; PC size — sidebar opens while running; reload keeps the tweak; seed storage with a stale fingerprint → notice appears; Copy settings yields valid JSON. Screenshots of both layouts.
- [ ] **Step 5:** Commit `feat: tuning panel with copy and reset`.

### Task 9: Publish and hand over

**Files:** Modify `README.md` (controls + "how to make a tweak permanent"), `CLAUDE.md` (commands: `npm test`, `npm run serve`).

- [ ] **Step 1:** Update docs.
- [ ] **Step 2:** `npm test` PASS; push to `main`.
- [ ] **Step 3:** Wait for Pages (`gh api repos/Snehiths19/lane-runner/pages/builds/latest --jq .status` → `built`), open https://snehiths19.github.io/lane-runner/ in Playwright and confirm the start screen renders with no console errors.
- [ ] **Step 4:** Give Snehith the 6-item acceptance checklist from the spec.
