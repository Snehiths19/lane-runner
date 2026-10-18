// Wires the pure game modules to the page and runs the animation loop.

import { createWorld } from './world.js';
import { createPlayer, handleAction, updatePlayer } from './player.js';
import { createGame, routeAction, advance, clampDt } from './game-state.js';
import { attachInput } from './input.js';
import { loadTuning } from './tuning.js';

const canvas = document.getElementById('game');
const stage = document.getElementById('stage');
const startScreen = document.getElementById('start');
const distanceEl = document.getElementById('distance');

const storage = (() => {
  try { return window.localStorage; } catch { return null; }
})();
const { cfg } = loadTuning(storage);

const game = createGame();
const player = createPlayer();
const world = createWorld(canvas);

function onAction(action) {
  const move = routeAction(game, action);
  startScreen.hidden = game.state !== 'start';
  if (move) handleAction(player, move, cfg);
}

attachInput(canvas, onAction);
// The start screen covers the canvas, so a tap on it starts the run (and only that).
startScreen.addEventListener('click', () => onAction('jump'));

new ResizeObserver(() => world.resize(stage.clientWidth, stage.clientHeight)).observe(stage);
world.resize(stage.clientWidth, stage.clientHeight);

let last = performance.now();
function frame(now) {
  const dt = clampDt((now - last) / 1000);
  last = now;
  const runDt = advance(game, dt, cfg.runSpeed);
  updatePlayer(player, runDt, cfg);
  world.update(cfg.runSpeed * runDt, player, cfg);
  distanceEl.textContent = `${Math.floor(game.distance)} m`;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Exposed for browser checks during development.
window.__laneRunner = { game, player, cfg };
