# Rules Layering (Baseline + Tweaks) Implementation Plan

> **For agentic workers:** Execute natively in this session with the `tdd` skill (red-green-refactor),
> pushing after every commit, as Snehith asked. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Every Subway-faithful number lives in one baseline file and Snehith's personal changes live in a
separate tweaks file, merged at load with protection against typos.

**Architecture:** `src/rules/baseline.js` exports `BASELINE` (nested by area, e.g. `movement`), each value
commented with its `FEATURES.md` ID. `src/rules/tweaks.js` exports `TWEAKS`, a partial of the same shape.
`src/rules/index.js` merges them with `resolveRules` (throws on unknown paths and wrong types) and exports the
frozen `RULES`. `src/config.js` derives the slider `DEFAULTS` from `RULES.movement`, so nothing else changes.

**Tech Stack:** JavaScript ES modules, `node:test`.

**Spec:** `docs/adr/0002-baseline-copy-first-tweaks-separate.md`, `CONTEXT.md` (Baseline, Tweak), `FEATURES.md`.

## Global Constraints

- Baseline is never edited for taste; taste goes in tweaks (CONTEXT.md invariant).
- Current movement values stay exactly as they are today: baseline `runSpeed: 12, laneWidth: 2.5,
  laneSwitchTime: 0.12, jumpHeight: 2.2, gravity: 45, slideTime: 0.6, fastFallSpeed: 30`;
  tweaks `movement.runSpeed: 20`. Resolved defaults therefore don't change, so the defaults fingerprint
  doesn't change and players see no "New default settings loaded" notice from this refactor.
- No build step; plain ES modules.

## Review Focus

1. **Typo in tweaks** (`runSpeeed: 30`): must fail loudly (test run and page load), not be silently ignored. → Task 1 test `unknown tweak path throws, naming it`.
2. **Wrong type** (`runSpeed: "fast"`): must fail loudly. → Task 1 test `wrong tweak type throws`.
3. **Accidental mutation** (code writing into `RULES` or `BASELINE` at runtime): must not change the baseline. → Task 1 tests `result is frozen` and `inputs are not mutated`.
4. **Sliders editing `RULES`**: the live tuning copy must stay mutable even though `RULES` is frozen. → Task 2 test `DEFAULTS is a mutable copy`.
5. **Fingerprint drift from the refactor**: defaults identical before and after. → Task 2 test `defaults match today's values`.

---

### Task 1: resolveRules

**Files:** Create `src/rules/resolve.js`, `tests/rules.test.js`.

**Interfaces — Produces:** `resolveRules(baseline: object, tweaks: object) → object` (deep-frozen merged copy).
Throws `Error` with message `Unknown tweak: <dotted.path>` or `Tweak <dotted.path> must be a <type>`.

- [ ] Tests, one red→green cycle each:
  - `no tweaks gives a copy of the baseline` — `deepEqual(resolveRules(b, {}), b)` and `notEqual` identity.
  - `a tweak overrides one nested value only` — `{movement:{runSpeed:20}}` → runSpeed 20, laneWidth unchanged.
  - `unknown tweak path throws, naming it` — `{movement:{runSpeeed:30}}` throws `/Unknown tweak: movement.runSpeeed/`; `{moovement:{}}` throws `/moovement/`.
  - `wrong tweak type throws` — `{movement:{runSpeed:'fast'}}` throws `/movement.runSpeed must be a number/`; `{movement: 5}` throws `/movement must be a object/`.
  - `result is frozen` — assigning `r.movement.runSpeed = 1` throws in strict mode (ES modules are strict).
  - `inputs are not mutated` — baseline and tweaks deep-equal their pre-call clones.
- [ ] Commit `feat: resolveRules merges baseline and tweaks with validation`.

### Task 2: Baseline, tweaks, and wiring into config

**Files:** Create `src/rules/baseline.js`, `src/rules/tweaks.js`, `src/rules/index.js`. Modify `src/config.js`, `tests/rules.test.js`.

**Interfaces — Consumes:** `resolveRules`. **Produces:** `BASELINE`, `TWEAKS`, `RULES` (from `src/rules/index.js`); `DEFAULTS` in `config.js` becomes `{ ...RULES.movement }`.

- [ ] Tests:
  - `shipped tweaks resolve against the baseline` — `RULES.movement.runSpeed === 20`, `BASELINE.movement.runSpeed === 12`.
  - `defaults match today's values` — `DEFAULTS` deep-equals the Global Constraints values with runSpeed 20.
  - `DEFAULTS is a mutable copy` — `DEFAULTS !== RULES.movement`, `Object.isFrozen(DEFAULTS) === false`.
- [ ] Baseline comments name the FEATURES.md ID and source per value (e.g. `// MOV-5, 🧪 measure from gameplay`). Tweaks comments say why and when (e.g. `// by feel, 2026-10-18`).
- [ ] Full `npm test` must report `fail 0` (existing 39 tests unchanged).
- [ ] Browser smoke check: page loads, run starts, no console errors.
- [ ] Commit `feat: baseline and tweaks layers drive movement defaults`.

### Task 3: Docs

**Files:** Modify `CLAUDE.md` (code map + "pasted Copy settings go into `src/rules/tweaks.js` as only the values that differ from the baseline; never edit baseline for taste"), `README.md` (how to make a tweak permanent; link to FEATURES.md; roadmap now follows FEATURES.md milestones M1–M6 + personal).

- [ ] Commit `docs: tweak workflow and FEATURES-driven roadmap`.
