import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseSections } from '../src/sections.js';
import { createTrack } from '../src/track.js';
import { createPlayer, updatePlayer, startIntro } from '../src/player.js';
import { DEFAULTS } from '../src/config.js';

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

const MOVING = parseSections(`name: oncoming
. . .
. . .
. M .
. M .
. . .`);
const movingOpts = { ...opts, trainSpeed: 10 };

test('stacked M rows become one moving train', () => {
  const track = createTrack(MOVING, movingOpts, seeded());
  track.fill(36 + 25);
  const trains = track.items.filter((i) => i.kind === 'train');
  assert.equal(trains.length, 1);
  assert.equal(trains[0].speed, 10);
  assert.equal(trains[0].end - trains[0].start, 10);
});

test('a moving train is placed further away so it meets the runner where the map shows', () => {
  const track = createTrack(MOVING, movingOpts, seeded());
  const runSpeed = 20;
  track.fill(36 + 25, 0, runSpeed);
  const [train] = track.items;
  const mapStart = 36 + 5; // second row of the section
  assert.equal(train.start, mapStart + mapStart * 10 / runSpeed);
  // Run both forward at constant speed until the runner reaches the map position.
  let distance = 0;
  const dt = 1 / 60;
  while (distance + runSpeed * dt <= mapStart + 1e-9) {
    distance += runSpeed * dt;
    track.move(dt);
  }
  assert.ok(Math.abs(train.start - distance) < 0.6, `met at ${train.start}, runner at ${distance}`);
});

test('move shifts only moving trains and remembers where they were', () => {
  const track = createTrack([...MOVING, ...SECTIONS], movingOpts, seeded());
  track.fill(300, 0, 20);
  const before = track.items.map((i) => i.start);
  track.move(0.5);
  track.items.forEach((item, k) => {
    if (item.speed) {
      assert.equal(item.prevStart, before[k]);
      assert.equal(item.start, before[k] - 5);
    } else {
      assert.equal(item.start, before[k]);
    }
  });
});

test('the intro train passes under the runner during the intro leap', () => {
  for (const runSpeed of [12, 20]) {
    const cfg = { ...DEFAULTS, runSpeed };
    const track = createTrack(SECTIONS, movingOpts, seeded());
    track.addIntroTrain({ runSpeed, gravity: cfg.gravity, leapHeight: 5 });
    const [train] = track.items;
    assert.equal(train.lane, 1);
    const p = createPlayer();
    startIntro(p, cfg, 5);
    let distance = 0;
    let passed = false;
    for (let t = 0; t < 1.5; t += 1 / 60) {
      updatePlayer(p, 1 / 60, cfg);
      distance += runSpeed / 60;
      track.move(1 / 60);
      const under = train.start <= distance + 0.3 && train.end >= distance - 0.3;
      if (under) assert.ok(p.y > opts.roofHeight, `speed ${runSpeed}: y ${p.y.toFixed(2)} over the train`);
      if (train.end < distance) passed = true;
    }
    assert.ok(passed, `speed ${runSpeed}: the train went past`);
  }
});

test('sections start only after the intro leap lands, even with slow tuning', () => {
  const track = createTrack(SECTIONS, movingOpts, seeded());
  track.addIntroTrain({ runSpeed: 40, gravity: 10, leapHeight: 5 });
  track.fill(400, 0, 40);
  const airTime = 2 * Math.sqrt(2 * 5 / 10);
  const first = track.items.filter((i) => !i.speed)[0];
  assert.ok(first.start > airTime * 40, `first item at ${first.start}, landing at ${airTime * 40}`);
});

test('a power-up spot becomes a power-up of a random kind, on the surface of its cell', () => {
  const [boost] = parseSections(`name: boost
. . .
. Bp .
. R .
p . .
. . .`);
  const track = createTrack([boost], { ...opts, powerUps: ['magnet', 'double'] }, seeded(3));
  track.fill(400);
  const ups = track.items.filter((i) => i.kind === 'powerup');
  assert.ok(ups.length >= 4);
  assert.ok(ups.every((u) => ['magnet', 'double'].includes(u.power)));
  assert.ok(new Set(ups.map((u) => u.power)).size === 2, 'both kinds turn up');
  assert.ok(ups.some((u) => u.base === opts.roofHeight), 'one on the roof');
  assert.ok(ups.some((u) => u.base === 0), 'one on the track');
});
