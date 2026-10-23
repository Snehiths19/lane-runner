// Section maps: text pictures of hand-made track stretches (see CONTEXT.md, ADR 0001).
// Each section starts with "name: ..."; each following line is one row with three space-separated
// cells (left, middle, right). The bottom line is the nearest row, so rows come out near → far.
// Mistakes throw with the section name and line number, so a typo can't slip into the game.

const OBSTACLES = ['L', 'O', 'B', 'R', 'M']; // low barrier, overhead bar, train, ramp, moving train
const COINS = ['c', '^'];          // coin, high coin
const MIN_TWO_LANE_ROWS = 4;       // clear lines needed to switch two lanes between trains (our call)

function parseCell(token, where) {
  const cell = { obstacle: null, coin: null };
  if (token === '.') return cell;
  for (const ch of token) {
    if (OBSTACLES.includes(ch) && cell.obstacle) {
      const why = ch === 'R' || cell.obstacle === 'R' ? "a ramp can't share a cell with another obstacle" : 'only one obstacle per cell';
      throw new Error(`${where}: ${why}`);
    }
    if (OBSTACLES.includes(ch)) cell.obstacle = ch;
    else if (COINS.includes(ch)) cell.coin = ch;
    else throw new Error(`${where}: unknown symbol "${ch}"`);
  }
  return cell;
}

export function parseSections(text) {
  const sections = [];
  text.split(/\r?\n/).forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    if (trimmed.startsWith('name:')) {
      sections.push({ name: trimmed.slice(5).trim(), rows: [], lines: [] });
      return;
    }
    if (!sections.length) throw new Error(`Line ${i + 1}: rows must come after a "name:" line`);
    const where = `Section "${sections.at(-1).name}", line ${i + 1}`;
    const tokens = trimmed.split(/\s+/);
    if (tokens.length !== 3) throw new Error(`${where}: each row needs 3 cells, found ${tokens.length}`);
    sections.at(-1).rows.push(tokens.map((token) => parseCell(token, where)));
    sections.at(-1).lines.push(i + 1);
  });
  for (const s of sections) {
    s.rows.reverse();
    const lines = s.lines.reverse();
    delete s.lines;
    // A ramp sits directly in front of a train in the same lane (CONTEXT.md invariant).
    s.rows.forEach((row, r) => row.forEach((cell, lane) => {
      if (cell.obstacle === 'R' && s.rows[r + 1]?.[lane].obstacle !== 'B') {
        throw new Error(`Section "${s.name}", line ${lines[r]}: a ramp must lead onto a train (put B on the line above it)`);
      }
    }));
    // A moving train drives through its lane, so nothing may sit beyond it in this section; that way
    // it meets the runner where the map shows it (CONTEXT.md: Moving train).
    for (let lane = 0; lane < 3; lane++) {
      const first = s.rows.findIndex((row) => row[lane].obstacle === 'M');
      if (first < 0) continue;
      let r = first;
      while (s.rows[r + 1]?.[lane].obstacle === 'M') r++;
      for (r += 1; r < s.rows.length; r++) {
        const cell = s.rows[r][lane];
        if (cell.obstacle || cell.coin) {
          throw new Error(`Section "${s.name}", line ${lines[r]}: a moving train's lane must be empty beyond it`);
        }
      }
    }
    // There must always be a way through: a runner can't cross a train's side to reach the only
    // open lane. Trains with a ramp count as open, since their roof can be run on.
    const stuck = noWayThrough(s);
    if (stuck >= 0) throw new Error(`Section "${s.name}", line ${lines[stuck]}: no way through (trains block every lane you can reach)`);
    // Switching across two lanes between trains needs room (our call, so it stays fair at full speed).
    s.trainRows = trainRows(s);
    for (let k = 1; k < s.trainRows.length; k++) {
      const before = s.trainRows[k - 1];
      const after = s.trainRows[k];
      if (tooTight(before, after, after.r - before.r - 1)) {
        throw new Error(`Section "${s.name}", line ${lines[after.r]}: switching two lanes between trains needs ${MIN_TWO_LANE_ROWS} clear lines`);
      }
    }
    // Any two sections must be able to follow each other (CONTEXT.md invariant).
    const clear = (row) => row.every((c) => !c.obstacle && !c.coin);
    if (!s.rows.length || !clear(s.rows[0]) || !clear(s.rows.at(-1))) {
      throw new Error(`Section "${s.name}": first and last rows must be clear`);
    }
  }
  // The same goes where one section's last train meets the next section's first. A section only
  // follows itself when it's the only one.
  for (const a of sections) {
    for (const b of sections) {
      if ((a === b && sections.length > 1) || !a.trainRows.length || !b.trainRows.length) continue;
      const gap = a.rows.length - 1 - a.trainRows.at(-1).r + b.trainRows[0].r;
      if (tooTight(a.trainRows.at(-1), b.trainRows[0], gap)) {
        throw new Error(`Sections "${a.name}" then "${b.name}": switching two lanes between trains needs ${MIN_TWO_LANE_ROWS} clear lines across the join`);
      }
    }
  }
  for (const s of sections) delete s.trainRows;
  return sections;
}

// The first row (index) where no lane the runner can reach is open, or -1 if there's always a way.
// Sideways moves within a row only pass open lanes; a lane stays reachable while it stays open.
function noWayThrough(section) {
  const rampTrain = [false, false, false]; // the train now in each lane was reached by a ramp
  let reach = [true, true, true];
  for (let r = 0; r < section.rows.length; r++) {
    const row = section.rows[r];
    const open = row.map((cell, lane) => {
      const train = cell.obstacle === 'B' || cell.obstacle === 'M';
      if (!train) rampTrain[lane] = cell.obstacle === 'R';
      return !train || rampTrain[lane];
    });
    const next = reach.map((ok, lane) => ok && open[lane]);
    for (let pass = 0; pass < 2; pass++) {
      for (let lane = 0; lane < 3; lane++) {
        if (!next[lane] && open[lane] && (next[lane - 1] || next[lane + 1])) next[lane] = true;
      }
    }
    if (!next.some(Boolean)) return r;
    reach = next;
  }
  return -1;
}

// Rows with a train (B or M) in them, with the lanes left open.
function trainRows(section) {
  return section.rows.map((row, r) => ({ r, open: [0, 1, 2].filter((l) => !'BM'.includes(row[l].obstacle ?? '.')) }))
    .filter(({ open }) => open.length < 3);
}

// Going from any open lane before to any open lane after means crossing two lanes, with too little room.
function tooTight(before, after, gap) {
  return gap < MIN_TWO_LANE_ROWS && before.open.every((a) => after.open.every((b) => Math.abs(a - b) >= 2));
}
