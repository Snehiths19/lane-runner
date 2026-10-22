import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseSections } from '../src/sections.js';
import { createTrack } from '../src/track.js';

const opts = { rowLength: 5, startClear: 36, roofHeight: 3.6 };
const SECTIONS = parseSections(`name: barrier
. . .
. L .
. . .
name: coins
. . .
c . .
c . .
. . .`);

// Deterministic random numbers for repeatable tests.
function seeded(seed = 1) {
  return () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
}

test('first item is past the start clear stretch', () => {
  const track = createTrack(SECTIONS, opts, seeded());
  track.fill(200);
  assert.ok(track.items.length > 0);
  assert.ok(track.items[0].start >= 36, `first at ${track.items[0].start}`);
});

test('fill places sections back to back up to the requested distance', () => {
  const track = createTrack(SECTIONS, opts, seeded());
  track.fill(100);
  const last = track.items.at(-1).end;
  track.fill(300);
  assert.ok(track.items.at(-1).start > 250, 'kept filling');
  assert.ok(track.items.some((i) => i.start > last), 'appended, not replaced');
  for (let i = 1; i < track.items.length; i++) {
    assert.ok(track.items[i].start >= track.items[i - 1].start, 'sorted by start');
  }
});

test('never the same section twice in a row', () => {
  // "barrier" places one low barrier, "coins" places two coins; a repeat would show up as
  // two barriers in a row or four coins in a row.
  const track = createTrack(SECTIONS, opts, seeded(7));
  track.fill(36 + 50 * 20);
  const kinds = track.items.map((i) => i.kind).join(',');
  assert.ok(track.items.length > 40, `${track.items.length} items`);
  assert.ok(!kinds.includes('low,low'), 'barrier section repeated');
  assert.ok(!kinds.includes('coin,coin,coin'), 'coin section repeated');
});

test('stacked B rows become one train', () => {
  const [wall] = parseSections(`name: wall
. . .
B . .
B . .
B . .
. . .`);
  const track = createTrack([wall], opts, seeded());
  track.fill(36 + 25);
  const trains = track.items.filter((i) => i.kind === 'train');
  assert.equal(trains.length, 1);
  assert.equal(trains[0].lane, 0);
  assert.equal(trains[0].end - trains[0].start, 15);
});

test('drops passed items', () => {
  const track = createTrack(SECTIONS, opts, seeded());
  track.fill(500);
  const before = track.items.length;
  track.dropBefore(300);
  assert.ok(track.items.length < before);
  assert.ok(track.items.every((i) => i.end >= 300));
});

test('reset clears items and starts again after the clear stretch', () => {
  const track = createTrack(SECTIONS, opts, seeded());
  track.fill(500);
  track.reset();
  assert.equal(track.items.length, 0);
  track.fill(100);
  assert.ok(track.items[0].start >= 36 && track.items[0].start < 60);
});

test('shipped sections are valid and plentiful', () => {
  const text = readFileSync(new URL('../sections.txt', import.meta.url), 'utf8');
  const sections = parseSections(text);
  assert.ok(sections.length >= 8, `${sections.length} sections`);
  const names = new Set(sections.map((s) => s.name));
  assert.equal(names.size, sections.length, 'section names are unique');
  for (const s of sections) {
    // Every row must leave at least one lane open to run through (no full walls).
    s.rows.forEach((row, r) => {
      assert.ok(row.some((c) => c.obstacle !== 'B'), `${s.name} row ${r} is blocked in all lanes`);
    });
  }
});

const ROOFTOP = parseSections(`name: rooftop
. . .
. B^ .
. Bc .
. Rc .
. . .`);

test('a ramp sits right in front of its train', () => {
  const track = createTrack(ROOFTOP, opts, seeded());
  track.fill(60);
  const ramp = track.items.find((i) => i.kind === 'ramp');
  const train = track.items.find((i) => i.kind === 'train');
  assert.ok(ramp, 'ramp item exists');
  assert.equal(ramp.lane, 1);
  assert.equal(ramp.end - ramp.start, 5);
  assert.equal(ramp.end, train.start);
});

test('coins on a roof or ramp sit on that surface', () => {
  const track = createTrack(ROOFTOP, opts, seeded());
  track.fill(60);
  const coins = track.items.filter((i) => i.kind === 'coin' || i.kind === 'highcoin');
  const [rampCoin, roofCoin, roofHigh] = coins;
  assert.equal(rampCoin.base, 1.8, 'mid-ramp height');
  assert.equal(roofCoin.base, 3.6);
  assert.equal(roofHigh.kind, 'highcoin');
  assert.equal(roofHigh.base, 3.6);
});
