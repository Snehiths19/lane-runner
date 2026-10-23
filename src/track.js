// The endless track: sections chained one after another, as items placed by distance.
// An item is { id, kind, lane, start, end, base }; start/end are metres from the run's start and
// base is the height of the surface it sits on (0 = track; roof or ramp for raised coins).
// A moving train also has speed (metres per second toward the runner) and prevStart (last frame's front).

const KIND = { L: 'low', O: 'over', B: 'train', c: 'coin', '^': 'highcoin', p: 'powerup' };
const DEPTH = { low: 0.4, over: 0.4, coin: 0.6, highcoin: 0.6, powerup: 0.8 };

// powerUps: the power-up kinds a `p` spot can become (picked at random).
export function createTrack(sections, { rowLength, startClear, roofHeight, trainSpeed = 0, powerUps = ['magnet'] }, random = Math.random) {
  const items = [];
  let nextStart = startClear;
  let nextId = 1;
  let last = null;

  // distance/runSpeed: where the runner is now and how fast, so a moving train can start far enough
  // away to meet them where the map shows it.
  function place(section, offset, distance, runSpeed) {
    const added = [];
    const openTrain = [null, null, null]; // a train still growing in each lane
    section.rows.forEach((row, r) => {
      const rowStart = offset + r * rowLength;
      const centre = rowStart + rowLength / 2;
      row.forEach((cell, lane) => {
        if (cell.obstacle === 'B' || cell.obstacle === 'M') {
          // Stacked B (or M) rows form one long train.
          const speed = cell.obstacle === 'M' ? trainSpeed : 0;
          if (openTrain[lane]?.speed === speed) openTrain[lane].end = rowStart + rowLength;
          else added.push(openTrain[lane] = { id: nextId++, kind: 'train', lane, start: rowStart, end: rowStart + rowLength, base: 0, speed });
        } else {
          openTrain[lane] = null;
        }
        if (cell.obstacle === 'R') {
          added.push({ id: nextId++, kind: 'ramp', lane, start: rowStart, end: rowStart + rowLength, base: 0 });
        }
        for (const symbol of [cell.obstacle, cell.coin]) {
          if (!symbol || symbol === 'B' || symbol === 'R' || symbol === 'M') continue;
          const kind = KIND[symbol];
          const half = DEPTH[kind] / 2;
          // Coins ride on the surface of their cell: a train roof, or halfway up a ramp.
          const base = cell.obstacle === 'B' ? roofHeight : cell.obstacle === 'R' ? roofHeight / 2 : 0;
          const item = { id: nextId++, kind, lane, start: centre - half, end: centre + half, base };
          if (kind === 'powerup') item.power = powerUps[Math.floor(random() * powerUps.length)];
          added.push(item);
        }
      });
    });
    for (const item of added) {
      if (!item.speed) continue;
      const lead = Math.max(0, item.start - distance) * item.speed / runSpeed;
      item.start += lead;
      item.end += lead;
      item.prevStart = item.start;
    }
    items.push(...added.sort((x, y) => x.start - y.start));
  }

  // The intro leap's train (CONTEXT.md: Intro leap): one car in the middle lane, timed so it passes
  // under the runner around the top of a leapHeight jump that starts now, at distance 0.
  function addIntroTrain({ runSpeed, gravity, leapHeight }) {
    const length = 2 * rowLength;
    const closing = runSpeed + trainSpeed;
    const peakTime = Math.sqrt(2 * leapHeight / gravity);
    const front = (peakTime - length / closing / 2) * closing;
    items.unshift({ id: nextId++, kind: 'train', lane: 1, start: front, end: front + length, base: 0, speed: trainSpeed, prevStart: front });
    // Nothing can be hit during the leap, so sections only start after the landing (with some room).
    nextStart = Math.max(nextStart, 2 * peakTime * runSpeed + 2 * rowLength);
  }

  // Moving trains drive toward the runner.
  function move(dt) {
    for (const item of items) {
      if (!item.speed) continue;
      item.prevStart = item.start;
      item.start -= item.speed * dt;
      item.end -= item.speed * dt;
    }
  }

  function fill(upTo, distance = 0, runSpeed = Infinity) {
    while (nextStart < upTo) {
      // Never the same section twice in a row (when there's a choice).
      const choices = sections.length > 1 ? sections.filter((s) => s !== last) : sections;
      const section = choices[Math.floor(random() * choices.length)];
      last = section;
      place(section, nextStart, distance, runSpeed);
      nextStart += section.rows.length * rowLength;
    }
  }

  // Forget items the runner has fully passed, so long runs don't grow without limit.
  function dropBefore(distance) {
    const keep = items.filter((i) => i.end >= distance);
    items.splice(0, items.length, ...keep);
  }

  // A new run: empty track, starting again after the clear stretch.
  function reset() {
    items.length = 0;
    nextStart = startClear;
    last = null;
  }

  return { items, fill, move, addIntroTrain, dropBefore, reset };
}
