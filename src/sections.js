// Section maps: text pictures of hand-made track stretches (see CONTEXT.md, ADR 0001).
// Each section starts with "name: ..."; each following line is one row with three space-separated
// cells (left, middle, right). The bottom line is the nearest row, so rows come out near → far.
// Mistakes throw with the section name and line number, so a typo can't slip into the game.

const OBSTACLES = ['L', 'O', 'B', 'R', 'M']; // low barrier, overhead bar, train, ramp, moving train
const COINS = ['c', '^'];          // coin, high coin

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
    // Any two sections must be able to follow each other (CONTEXT.md invariant).
    const clear = (row) => row.every((c) => !c.obstacle && !c.coin);
    if (!s.rows.length || !clear(s.rows[0]) || !clear(s.rows.at(-1))) {
      throw new Error(`Section "${s.name}": first and last rows must be clear`);
    }
  }
  return sections;
}
