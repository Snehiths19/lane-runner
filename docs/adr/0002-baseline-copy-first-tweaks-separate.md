# Copy Subway Surfers rule for rule first; keep personal tweaks separate

Snehith wants the game to match Subway Surfers exactly before personalizing it. We therefore
rebuild every feature from public sources (SYBO's help center, the fan wiki, Wikipedia) and
frame-by-frame gameplay measurement, not by reverse engineering or modifying the real game.
Every Subway-faithful number lives in one **baseline** with its source; personal changes live in a
separate **tweaks** layer that overrides it. This reverses three earlier personal choices (harmless
edge swipes, distance-only score, no revive) back to Subway behavior, and pulls rideable trains forward.

## Considered options

- **Modify the real game (APK/asset extraction)**: exact art, but compiled IL2CPP code is
  impractical to change, tweaks like faces and friend events become hard, it can't be hosted
  publicly, and modded APKs are a malware risk.
- **Reverse engineer with REA for exact internals**: hours of Unity extraction for numbers that
  are mostly public or measurable; kept only for narrow, undocumented questions.
- **Edit values in place when tweaking**: simpler, but loses the record of what Subway Surfers
  actually does, so "reset to the real thing" becomes impossible.

## Consequences

Art, characters, music and the name are not copied (only rules), so the look stays ours.
The roadmap follows `FEATURES.md` instead of the original 5 steps.
