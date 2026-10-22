// Tunnels (CONTEXT.md): covered stretches of track, looks only. The first starts `every` metres
// into the run and one follows every `every` metres, each `length` long.

export function tunnelsBetween(from, to, { every, length }) {
  const tunnels = [];
  for (let k = Math.max(1, Math.floor((from - length) / every)); k * every <= to; k++) {
    const start = k * every;
    if (start + length >= from) tunnels.push({ start, end: start + length });
  }
  return tunnels;
}
