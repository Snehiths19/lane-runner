// Section maps: text pictures of hand-made track stretches (see CONTEXT.md, ADR 0001).
// Each section starts with "name: ..."; each following line is one row with three space-separated
// cells (left, middle, right). The bottom line is the nearest row, so rows come out near → far.
// Mistakes throw with the section name and line number, so a typo can't slip into the game.

const OBSTACLES = ['L', 'O', 'B']; // low barrier, overhead bar, train
const COINS = ['c', '^'];          // coin, high coin

function parseCell(token, where) {
  const cell = { obstacle: null, coin: null };
  if (token === '.') return cell;
  for (const ch of token) {
    if (OBSTACLES.includes(ch)) cell.obstacle = ch;
    else if (COINS.includes(ch)) cell.coin = ch;
    else throw new Error(`${where}: unknown symbol "${ch}"`);
  }
  if (cell.obstacle === 'B' && cell.coin) throw new Error(`${where}: coin inside a train`);
  return cell;
}

export function parseSections(text) {
  const sections = [];
  text.split(/\r?\n/).forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    if (trimmed.startsWith('name:')) {
      sections.push({ name: trimmed.slice(5).trim(), rows: [] });
      return;
    }
    if (!sections.length) throw new Error(`Line ${i + 1}: rows must come after a "name:" line`);
    const where = `Section "${sections.at(-1).name}", line ${i + 1}`;
    const tokens = trimmed.split(/\s+/);
    if (tokens.length !== 3) throw new Error(`${where}: each row needs 3 cells, found ${tokens.length}`);
    sections.at(-1).rows.push(tokens.map((token) => parseCell(token, where)));
  });
  for (const s of sections) {
    s.rows.reverse();
    // Any two sections must be able to follow each other (CONTEXT.md invariant).
    const clear = (row) => row.every((c) => !c.obstacle && !c.coin);
    if (!s.rows.length || !clear(s.rows[0]) || !clear(s.rows.at(-1))) {
      throw new Error(`Section "${s.name}": first and last rows must be clear`);
    }
  }
  return sections;
}
