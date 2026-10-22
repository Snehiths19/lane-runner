// The endless track: sections chained one after another, as items placed by distance.
// An item is { id, kind, lane, start, end }; start/end are metres from the run's start.

const KIND = { L: 'low', O: 'over', B: 'block', c: 'coin', '^': 'highcoin' };
const DEPTH = { low: 0.4, over: 0.4, coin: 0.6, highcoin: 0.6 };

export function createTrack(sections, { rowLength, startClear }, random = Math.random) {
  const items = [];
  let nextStart = startClear;
  let nextId = 1;
  let last = null;

  function place(section, offset) {
    const added = [];
    const openBlock = [null, null, null]; // a blocker still growing in each lane
    section.rows.forEach((row, r) => {
      const rowStart = offset + r * rowLength;
      const centre = rowStart + rowLength / 2;
      row.forEach((cell, lane) => {
        if (cell.obstacle === 'B') {
          // Stacked B rows form one long blocker.
          if (openBlock[lane]) openBlock[lane].end = rowStart + rowLength;
          else added.push(openBlock[lane] = { id: nextId++, kind: 'block', lane, start: rowStart, end: rowStart + rowLength });
        } else {
          openBlock[lane] = null;
        }
        for (const symbol of [cell.obstacle, cell.coin]) {
          if (!symbol || symbol === 'B') continue;
          const kind = KIND[symbol];
          const half = DEPTH[kind] / 2;
          added.push({ id: nextId++, kind, lane, start: centre - half, end: centre + half });
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
