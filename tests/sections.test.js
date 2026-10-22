import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSections } from '../src/sections.js';

const E = { obstacle: null, coin: null };

test('parses a section with rows ordered near to far', () => {
  const [s] = parseSections(`name: one
. . .
L . c
. . .`);
  assert.equal(s.name, 'one');
  assert.equal(s.rows.length, 3);
  assert.deepEqual(s.rows[1], [{ obstacle: 'L', coin: null }, E, { obstacle: null, coin: 'c' }]);
  assert.deepEqual(s.rows[0], [E, E, E]);
});

test('bottom line is the nearest row', () => {
  const [s] = parseSections(`name: order
. . .
O . .
. . B
. . .`);
  assert.equal(s.rows[1][2].obstacle, 'B');
  assert.equal(s.rows[2][0].obstacle, 'O');
});

test('a cell can combine an obstacle with a high coin', () => {
  const [s] = parseSections(`name: combo
. . .
. L^ .
. . .`);
  assert.deepEqual(s.rows[1][1], { obstacle: 'L', coin: '^' });
});

test('blank lines and # comments are ignored; sections split on name:', () => {
  const list = parseSections(`# my sections
name: a
. . .
. c .
. . .

# another
name: b
. . .
. . .`);
  assert.deepEqual(list.map((s) => [s.name, s.rows.length]), [['a', 3], ['b', 2]]);
});

test('rejects unknown symbols, naming section and line', () => {
  assert.throws(() => parseSections(`name: typo
. . .
. X .
. . .`), /typo.*line 3.*"X"/);
});

test('rejects rows without exactly 3 cells', () => {
  assert.throws(() => parseSections(`name: wide
. . .
. . . .
. . .`), /wide.*line 3.*3 cells/);
});

test('rejects rows before any name:', () => {
  assert.throws(() => parseSections(`. . .`), /line 1.*name:/i);
});

test('rejects a section whose first or last row is not clear', () => {
  assert.throws(() => parseSections(`name: openfar
. B .
. . .
. . .`), /openfar.*first and last rows must be clear/);
  assert.throws(() => parseSections(`name: opennear
. . .
. . .
c . .`), /opennear.*first and last rows must be clear/);
});

test('a ramp leads onto a train, with coins on ramp and roof', () => {
  const [s] = parseSections(`name: rooftop
. . .
. B^ .
. Bc .
. Rc .
. . .`);
  assert.deepEqual(s.rows[1][1], { obstacle: 'R', coin: 'c' });
  assert.deepEqual(s.rows[2][1], { obstacle: 'B', coin: 'c' });
  assert.deepEqual(s.rows[3][1], { obstacle: 'B', coin: '^' });
});

test('rejects a ramp that does not lead onto a train', () => {
  assert.throws(() => parseSections(`name: nowhere
. . .
. . .
. R .
. . .`), /nowhere.*line 4.*ramp must lead onto a train/);
});

test('rejects a ramp combined with another obstacle', () => {
  assert.throws(() => parseSections(`name: clash
. . .
. B .
. RL .
. . .`), /clash.*line 4.*ramp can't share a cell/);
});

test('rejects two obstacles in one cell', () => {
  assert.throws(() => parseSections(`name: pile
. . .
. LO .
. . .`), /pile.*line 3.*only one obstacle per cell/);
});
