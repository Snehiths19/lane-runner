// Wires the pure game modules to the page and runs the animation loop.

import { createWorld } from './world.js';
import { createPlayer, handleAction, updatePlayer, bounceBack } from './player.js';
import { createGame, routeAction, setPaused, advance, clampDt, crash, crashScreenReady, score } from './game-state.js';
import { attachInput } from './input.js';
import { loadTuning, saveTuning, settingsText } from './tuning.js';
import { buildPanel } from './panel.js';
import { RULES } from './rules/index.js';
import { parseSections } from './sections.js';
import { createTrack } from './track.js';
import { checkHits } from './hits.js';
import { groundHeightAt } from './ground.js';
import { loadRuns, recordRun } from './runs.js';

const canvas = document.getElementById('game');
const stage = document.getElementById('stage');
const startScreen = document.getElementById('start');
const scoreEl = document.getElementById('score');
const coinsEl = document.getElementById('coins');
const crashScreen = document.getElementById('crash');
const flash = document.getElementById('flash');
const gear = document.getElementById('gear');
const panel = document.getElementById('panel');
const notice = document.getElementById('notice');

const storage = (() => {
  try { return window.localStorage; } catch { return null; }
})();
const { cfg, resetNotice } = loadTuning(storage);

// Sections are checked as they load; a mistake in sections.txt shows on screen instead of
// quietly breaking the track.
let sections;
try {
  sections = parseSections(await (await fetch('sections.txt')).text());
} catch (err) {
  document.getElementById('start').querySelector('.hint').textContent = `sections.txt problem: ${err.message}`;
  throw err;
}

const game = createGame();
let player = createPlayer();
const world = createWorld(canvas);
const track = createTrack(sections, RULES.track);
let runId = game.runId;
let result = null; // this run's recorded score, best and top runs

function onAction(action) {
  const move = routeAction(game, action);
  startScreen.hidden = game.state !== 'start';
  if (move) handleAction(player, move, cfg);
}

attachInput(canvas, onAction);
// The start and crash screens cover the canvas, so a tap on them only starts a run.
startScreen.addEventListener('click', () => onAction('jump'));
crashScreen.addEventListener('click', () => onAction('jump'));

function newRun() {
  player = createPlayer();
  window.__laneRunner.player = player;
  track.reset();
  world.reset();
  result = null;
  crashScreen.hidden = true;
}

function showCrashScreen() {
  const r = result;
  crashScreen.querySelector('.final-score').textContent = String(r.score);
  crashScreen.querySelector('.final-coins').textContent = String(game.coins);
  crashScreen.querySelector('.best').textContent = String(r.best);
  crashScreen.querySelector('.new-best').hidden = !r.newBest;
  const list = crashScreen.querySelector('.top-runs');
  list.replaceChildren(...r.top.map((s, i) => {
    const li = document.createElement('li');
    li.textContent = `${i + 1}. ${s}`;
    return li;
  }));
  crashScreen.hidden = false;
}

function onCrash(now) {
  crash(game, now);
  const finalScore = score(game, RULES);
  result = { score: finalScore, ...recordRun(storage, finalScore) };
  world.crashed();
  flash.classList.remove('on');
  void flash.offsetWidth; // restart the flash animation
  flash.classList.add('on');
}

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

const pad = (n) => String(n).padStart(6, '0');

let last = performance.now();
function frame(nowMs) {
  const now = nowMs / 1000;
  const dt = clampDt((nowMs - last) / 1000);
  last = nowMs;

  if (game.runId !== runId) { runId = game.runId; newRun(); }

  // Rules that need world sizes as well as the slider values.
  const worldCfg = { ...cfg, roofHeight: RULES.track.roofHeight };
  const prevDistance = game.distance;
  const runDt = advance(game, dt, cfg.runSpeed);
  const groundY = groundHeightAt(player.x, game.distance, track.items, worldCfg);
  updatePlayer(player, runDt, cfg, groundY);
  if (game.state === 'running') {
    track.fill(game.distance + 150);
    track.dropBefore(game.distance - 10);
    const hits = checkHits(player, track.items, game.distance, worldCfg, prevDistance);
    if (hits.sideBump && !hits.crash) bounceBack(player);
    if (hits.coins.length) {
      game.coins += hits.coins.length;
      const taken = new Set(hits.coins);
      track.items.splice(0, track.items.length, ...track.items.filter((i) => !taken.has(i.id)));
    }
    if (hits.crash) onCrash(now);
  }
  if (game.state === 'crashed' && crashScreen.hidden && crashScreenReady(game, now, RULES.crash.screenDelay)) {
    showCrashScreen();
  }

  world.update(cfg.runSpeed * runDt, player, cfg, track.items, game.distance, now, groundY, dt);
  scoreEl.textContent = pad(score(game, RULES));
  coinsEl.textContent = String(game.coins);
  requestAnimationFrame(frame);
}

// Exposed for browser checks during development.
window.__laneRunner = { game, player, cfg, track };
requestAnimationFrame(frame);
