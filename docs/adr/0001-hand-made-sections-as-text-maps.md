# Runs are built from hand-made sections written as text maps

Obstacles and coins come from short hand-made **sections**, chained in random order, instead of
being generated randomly row by row. Each section is a plain-text picture (one column per lane,
one row per stretch of track) kept in `sections.txt`, so Snehith, who doesn't code, can read and
write them, even from a phone on GitHub. This guarantees every stretch is fair and designed, and
lets future content (a San Jose section, a friend event) be just another entry. We accept less
variety until there are many sections, and that some placements (exact in-between positions)
can't be drawn without extending the format.

## Considered options

- **Random rows with a "one lane always free" rule**: endless variety, but no designed coin
  shapes, harder to guarantee fairness across rows, and no place for hand-authored moments.

## Update (2026-10-22)

After the baseline-first decision (ADR 0002), sections stay **original**: written by us in Subway
Surfers' style, with obstacle spacing and density measured from its gameplay, but not traced from its
layouts, which are its designers' content and would make the game unsafe to host publicly.
