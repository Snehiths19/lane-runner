// The endless track: sections chained one after another, as items placed by distance.
// An item is { id, kind, lane, start, end, base }; start/end are metres from the run's start and
// base is the height of the surface it sits on (0 = track; roof or ramp for raised coins).

const KIND = { L: 'low', O: 'over', B: 'train', c: 'coin', '^': 'highcoin' };
const DEPTH = { low: 0.4, over: 0.4, coin: 0.6, highcoin: 0.6 };

export function createTrack(sections, { rowLength, startClear, roofHeight }, random = Math.random) {
  const items = [];
  let nextStart = startClear;
  let nextId = 1;
  let last = null;

  function place(section, offset) {
    const added = [];
    const openTrain = [null, null, null]; // a train still growing in each lane
    section.rows.forEach((row, r) => {
      const rowStart = offset + r * rowLength;
      const centre = rowStart + rowLength / 2;
      row.forEach((cell, lane) => {
        if (cell.obstacle === 'B') {
          // Stacked B rows form one long train.
          if (openTrain[lane]) openTrain[lane].end = rowStart + rowLength;
          else added.push(openTrain[lane] = { id: nextId++, kind: 'train', lane, start: rowStart, end: rowStart + rowLength, base: 0 });
        } else {
          openTrain[lane] = null;
        }
        if (cell.obstacle === 'R') {
          added.push({ id: nextId++, kind: 'ramp', lane, start: rowStart, end: rowStart + rowLength, base: 0 });
        }
        for (const symbol of [cell.obstacle, cell.coin]) {
          if (!symbol || symbol === 'B' || symbol === 'R') continue;
          const kind = KIND[symbol];
          const half = DEPTH[kind] / 2;
          // Coins ride on the surface of their cell: a train roof, or halfway up a ramp.
          const base = cell.obstacle === 'B' ? roofHeight : cell.obstacle === 'R' ? roofHeight / 2 : 0;
          added.push({ id: nextId++, kind, lane, start: centre - half, end: centre + half, base });
        }
      });
    });
    items.push(...added.sort((x, y) => x.start - y.start));
  }

  function fill(upTo) {
    while (nextStart < upTo) {
      // Never the same section twice in a row (when there's a choice).
      const choices = sections.length > 1 ? sections.filter((s) => s !== last) : sections;
      const section = choices[Math.floor(random() * choices.length)];
      last = section;
      place(section, nextStart);
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

  return { items, fill, dropBefore, reset };
}
