// Wires the pure game modules to the page and runs the animation loop.

import { createWorld } from './world.js';
import { createPlayer, handleAction, updatePlayer } from './player.js';
import { createGame, routeAction, setPaused, advance, clampDt } from './game-state.js';
import { attachInput } from './input.js';
import { loadTuning, saveTuning, settingsText } from './tuning.js';
import { buildPanel } from './panel.js';

const canvas = document.getElementById('game');
const stage = document.getElementById('stage');
const startScreen = document.getElementById('start');
const distanceEl = document.getElementById('distance');
const gear = document.getElementById('gear');
const panel = document.getElementById('panel');
const notice = document.getElementById('notice');

const storage = (() => {
  try { return window.localStorage; } catch { return null; }
})();
const { cfg, resetNotice } = loadTuning(storage);

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

let noticeTimer;
function showNotice(text) {
  notice.textContent = text;
  notice.hidden = false;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { notice.hidden = true; }, 3000);
}
if (resetNotice) showNotice('New default settings loaded');

// Phone layout (narrow): the panel covers the game, so the run pauses.
// PC layout: the panel is a side bar and the run keeps going.
const phoneLayout = window.matchMedia('(max-width: 699px)');
function setPanelOpen(open) {
  panel.hidden = !open;
  gear.setAttribute('aria-expanded', String(open));
  setPaused(game, open && phoneLayout.matches);
}
gear.addEventListener('click', () => {
  gear.blur(); // so Space doesn't press the button again
  setPanelOpen(panel.hidden);
});

const showCopyFallback = buildPanel(panel, cfg, {
  onChange: () => saveTuning(storage, cfg),
  onCopy: async () => {
    const text = settingsText(cfg);
    try {
      await navigator.clipboard.writeText(text);
      showNotice('Settings copied: paste them to Claude to make them the defaults');
    } catch {
      showCopyFallback(text);
    }
  },
  onClose: () => setPanelOpen(false),
});

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
