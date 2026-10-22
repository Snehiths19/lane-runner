# Feature checklist

Everything Subway Surfers has, what it does there (the **baseline**), where that comes from, and
whether Lane Runner has it yet. Personal changes go in **Your tweak**; the baseline columns only
change when better evidence about Subway Surfers turns up. See `CONTEXT.md` for the terms used.

**How to change something:** write what you want in *Your tweak* (plain words are fine, e.g.
"jetpack 40 s" or "no dog"), commit, and ask Claude to apply it. Claude puts the change in
`src/rules/tweaks.js`, never in the baseline.

**Status:** ✅ built · 🔨 next up · ⬜ to do · 🧪 number must be measured from gameplay first · ➖ not planned (reason given)

**Measuring (M):** done on the official web version (Poki, by SYBO) by recording the game's frames at
~59 fps with timestamps. The camera follows the runner, so on-screen positions understate motion;
rough values are marked as such and stay 🧪 until confirmed.

**Source:** **H** = SYBO's official help center · **W** = Subway Surfers fan wiki · **WP** = Wikipedia ·
**G** = guide/blog sites (low confidence) · **M** = measure from gameplay video

---

## M1 · Movement (the canvas)

| ID | Feature | Baseline | Numbers (source) | Status | Your tweak |
|---|---|---|---|---|---|
| MOV-1 | Three lanes, endless forward run | Run forward automatically; swipe to dodge | — (WP) | ✅ | |
| MOV-2 | Lane change | Swipe left/right; works mid-air and mid-switch | ≈ 0.15–0.2 s, rough (M, 2026-10-22) 🧪 | ✅ | |
| MOV-3 | Jump | Swipe up | air time ≈ 0.7 s (M, 2026-10-22) → gravity 36; height 🧪 | ✅ | |
| MOV-4 | Roll | Swipe down; mid-air swipe down drops fast into a roll | roll time 🧪 (M) | ✅ | |
| MOV-5 | Run speed | Starts at a base speed | base speed 🧪 (M) | ✅ | Run speed 20 (by feel, 2026-10-18) |
| MOV-6 | Speed ramp | Speed rises gradually during a run | curve & cap 🧪 (M) | ⬜ | |
| CAM-1 | Camera follow | Camera rises with the runner during a jump and slides with lane changes, then settles | amount 🧪 (M) | ⬜ | |
| MOV-7 | Edge swipe | Swiping into the wall at the track edge = side bump | — (M) | ⬜ | |

## M2 · Core loop (track, hits, chase, score)

Built in four playable slices, in order: **2a Dodge & crash** (TRK-1–4, HIT-1, COI-1, SCO-1–2, RUN-1) →
**2b Trains** (TRK-5, 7, 8) → **2c Chase** (HIT-2–3, CHS-1, MOV-7) → **2d Alive world** (TRK-6, 9, MOV-6,
CHS-2, CAM-1). Revive waits for keys in M4.

| ID | Feature | Baseline | Numbers (source) | Status | Your tweak |
|---|---|---|---|---|---|
| TRK-1 | Sections | Track built from hand-made sections chained at random (ADR 0001) | 5 m rows (our call) | 🔨 | |
| TRK-2 | Low barrier | Jump over | — (WP) | 🔨 | |
| TRK-3 | Overhead bar | Roll under | — (WP) | 🔨 | |
| TRK-4 | Blocker / wall | Change lanes around it | — (WP: "poles, tunnel walls") | 🔨 | |
| TRK-5 | Parked train | Head-on = crash; can run on its roof | train length 🧪 (M) | 🔨 | |
| TRK-6 | Moving train | Comes toward you; head-on = crash | train speed 🧪 (M) | ⬜ | |
| TRK-7 | Ramp | Slope at a train's back to run onto the roof | — (M) | 🔨 | |
| TRK-8 | Train roofs | Run on top of trains; jump between them; drop off the end | ground height logic | 🔨 | |
| TRK-9 | Tunnels | Track passes through tunnels (visual + walls) | — (WP) | ⬜ | |
| HIT-1 | Head-on hit | Crash | — | 🔨 | |
| HIT-2 | Side bump | Bounce back to the lane you left, and stumble | — (G) | 🔨 | |
| HIT-3 | Stumble | Inspector catches up; a second hit while stumbling = crash | window length 🧪 (M) | 🔨 | |
| CHS-1 | Inspector & dog | Chase you from the start, drop back, close in when you stumble, catch you on crash | — (WP) | 🔨 | |
| CHS-2 | Intro | Run starts with the character caught spraying graffiti, then chased; the runner opens with a leap over an oncoming train | — (WP, M) | ⬜ | |
| COI-1 | Coins on track | Lines and arcs of coins; high coins reached by jumping | — (WP) | 🔨 | |
| SCO-1 | Score | Score counts up with distance × score multiplier | ≈ 14.6 points/s at x1 at run start (M, 2026-10-22) | 🔨 | |
| SCO-2 | Best score | Highest score kept; "New best!" on crash screen | — | 🔨 | |
| RUN-1 | Crash screen | Notebook-style card: character, score, coins, keys & coin totals, leaderboard; buttons Menu / Boosts / PLAY (web: "Double Up" coins for an ad) | — (M) | 🔨 | Ads ➖ |

## M3 · Power-ups (picked up on the track)

| ID | Feature | Baseline | Numbers (source) | Status | Your tweak |
|---|---|---|---|---|---|
| PWR-1 | Coin magnet | Pulls nearby coins to you | base 🧪; +5 s per upgrade; max 30 s (W) | ⬜ | |
| PWR-2 | Jetpack | Fly above the track collecting a coin trail, then land | base 🧪; +5 s per upgrade; max 25 s (W) | ⬜ | |
| PWR-3 | Super sneakers | Much higher jumps (onto trains from the ground) | base 🧪; +5 s per upgrade; max 30 s (W) | ⬜ | |
| PWR-4 | 2X multiplier | Doubles the score rate while active | base 🧪; +5 s per upgrade; max 30 s (W, H) | ⬜ | |
| PWR-5 | Pogo stick | Launches you high into the air; not upgradable | duration 🧪 (W) | ⬜ | |
| PWR-6 | Timer overlap | Collecting a jetpack pauses the sneakers timer until the jetpack ends | — (W) | ⬜ | |
| PWR-7 | Mystery box (pickup) | Collected on track; opened after the run for a random prize | prize odds 🧪 | ⬜ | |

## M4 · Hoverboard, keys & revive

| ID | Feature | Baseline | Numbers (source) | Status | Your tweak |
|---|---|---|---|---|---|
| HOV-1 | Hoverboard | Double-tap to ride; absorbs one crash (board breaks, you keep running) | lasts 30 s (H, WP); reuse wait 5 s (G) 🧪 | ⬜ | |
| HOV-2 | Hoverboard stock | Boards are consumables you own; bought with coins | 300 coins each (W, G) | ⬜ | |
| KEY-1 | Keys | Rare currency; found in boxes and rewards | — (H) | ⬜ | |
| REV-1 | Revive | After a crash, spend keys to continue | 1, 2, 4, 8, 16… keys, doubling within a run (H) | ⬜ | |

## M5 · Progression & shop

| ID | Feature | Baseline | Numbers (source) | Status | Your tweak |
|---|---|---|---|---|---|
| UPG-1 | Power-up upgrades | Upgrade magnet / jetpack / sneakers / 2X duration with coins | 5 upgrades: 500, 1 000, 3 000, 10 000, 60 000 coins (W) | ⬜ | |
| MIS-1 | Missions | Sets of 3 tasks (e.g. "jump 20 times"); each finished set adds +1 to the permanent multiplier | 3 per set; cap x30 (x35 with pack) (H) | ⬜ | |
| MIS-2 | After x30 | Each finished set gives a Super Mystery Box instead | — (H) | ⬜ | |
| MIS-3 | Skip mission | Pay coins (or watch an ad) to skip one | cost 🧪 (H) | ⬜ | Ads ➖ (no ads in a personal game) |
| BST-1 | Score booster | Used at run start; raises the multiplier | +5 / +6 / +7 (W); 3 000 coins (W) | ⬜ | |
| BST-2 | Headstart | Used at run start; rockets you forward | 2 000 coins (W) | ⬜ | |
| BOX-1 | Mystery box (shop) | Buy and open for coins, items, keys or tokens | 500 coins (G); prizes up to 100 000 coins (W) | ⬜ | |
| BOX-2 | Super mystery box | Bigger prizes | prizes up to 300 000 coins (W) | ⬜ | |
| CHR-1 | Characters | Unlockable runners, most with up to 2 outfits | ~18 characters (WP) | ⬜ | Your face, friends (see Personal) |
| CHR-2 | Character tokens | Collected to unlock certain characters/outfits | — (W) | ⬜ | |
| BRD-1 | Boards with powers | Hoverboards can add a power: Double Jump, Super Jump, Speed Up, Smooth Drift, Zap Sideways, Stay Low | Speed Up ≈ 1.125× (G) 🧪 | ⬜ | |
| BRD-2 | Board cosmetics | Color Splash, Trail effects | — (H) | ⬜ | |
| MUL-1 | Other multiplier bonuses | Crew bonus, character bonus | — (H) | ➖ online/crew features | |

## M6 · Events & world

| ID | Feature | Baseline | Numbers (source) | Status | Your tweak |
|---|---|---|---|---|---|
| EVT-1 | Daily challenge (word hunt) | Collect letters on the track spelling a word (e.g. "JUMP") for a reward | — (WP) | ⬜ | |
| EVT-2 | Season hunt | Collect season tokens during runs to unlock reward tiers | 30 tiers, ~3 weeks per season (W, G) | ⬜ | |
| WLD-1 | World Tour | The setting changes to a new city every ~3 weeks, with a city character and board | — (WP) | ⬜ | San Jose first (see Personal) |
| ACH-1 | Achievements / collections | Long-term goals with rewards | — (H) | ⬜ | |
| ➖ | Ads, real-money shop, Facebook login, crews, online leaderboards | Monetization/online services | — | ➖ personal game, no server | |

## Personal additions (beyond Subway Surfers)

| ID | Feature | Idea | Status |
|---|---|---|---|
| PER-1 | My music | Your own soundtrack | ⬜ |
| PER-2 | My face | Your face on the runner (flat cutout style makes this a photo swap) | ⬜ |
| PER-3 | Friend events | Friends pop in mid-run doing something; some give power-ups | ⬜ |
| PER-4 | San Jose | A World Tour city of your own | ⬜ |

## Sources

- SYBO help center: [Hoverboards & their powers](https://sybo.helpshift.com/hc/en/5-subway-surfers/faq/208-hoverboards-their-powers/), [Score multiplier](https://sybo.helpshift.com/hc/en/5-subway-surfers/faq/211-score-multiplier/), [Missions](https://sybo.helpshift.com/hc/en/5-subway-surfers/faq/143-missions/), [Keys](https://sybo.helpshift.com/hc/en/5-subway-surfers/faq/148-keys/), [Season hunt](https://sybo.helpshift.com/hc/en/5-subway-surfers/faq/133-season-hunt/)
- [Wikipedia: Subway Surfers](https://en.wikipedia.org/wiki/Subway_Surfers)
- Fan wiki (read via search results; the site blocks automated reading): [Power-Ups](https://subwaysurf.fandom.com/wiki/Power-Ups), [Coin Magnet](https://subwaysurf.fandom.com/wiki/Coin_Magnet), [Super Sneakers](https://subwaysurf.fandom.com/wiki/Super_Sneakers), [Hoverboards](https://subwaysurf.fandom.com/wiki/Hoverboards), [Key](https://subwaysurf.fandom.com/wiki/Key), [Character Tokens](https://subwaysurf.fandom.com/wiki/Character_Tokens)
- Research date: 2026-10-21. The game updates often; numbers marked W or G may have drifted.
