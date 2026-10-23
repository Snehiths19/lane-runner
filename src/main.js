// Wires the pure game modules to the page and runs the animation loop.

import { createWorld } from './world.js';
import { createPlayer, handleAction, updatePlayer, bounceBack, startIntro } from './player.js';
import { createGame, routeAction, setPaused, advance, clampDt, crash, crashScreenReady, score, speedAt, substeps } from './game-state.js';
import { attachInput } from './input.js';
import { loadTuning, saveTuning, settingsText } from './tuning.js';
import { buildPanel } from './panel.js';
import { RULES } from './rules/index.js';
import { parseSections } from './sections.js';
import { createTrack } from './track.js';
import { checkHits, noHits } from './hits.js';
import { groundHeightAt } from './ground.js';
import { loadRuns, recordRun } from './runs.js';
import { createChase, updateChase, bump, startCatch } from './chase.js';
import { createPowerUps, collect, tickPowerUps, timeLeft, scoreMultiplier, pullCoins, takeItems, isActive } from './powerups.js';

const canvas = document.getElementById('game');
const stage = document.getElementById('stage');
const startScreen = document.getElementById('start');
const scoreEl = document.getElementById('score');
const coinsEl = document.getElementById('coins');
const multEl = document.querySelector('#hud .mult');
const powersEl = document.getElementById('powers');
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
let chase = createChase(RULES.chase);
let powerUps = createPowerUps();
const world = createWorld(canvas);
const track = createTrack(sections, { ...RULES.track, powerUps: Object.keys(RULES.powerUps) });
let runId = game.runId;
let result = null; // this run's recorded score, best and top runs

// Every run opens with the intro leap over an oncoming train (CONTEXT.md: Intro leap).
function beginRun() {
  startIntro(player, cfg, RULES.intro.leapHeight);
  track.addIntroTrain({ runSpeed: cfg.runSpeed, gravity: cfg.gravity, leapHeight: RULES.intro.leapHeight });
}

function onAction(action) {
  const wasStart = game.state === 'start';
  const move = routeAction(game, action);
  if (wasStart && game.state === 'running') beginRun();
  startScreen.hidden = game.state !== 'start';
  if (move && handleAction(player, move, cfg) === 'edge') onBump(performance.now() / 1000);
}

// A side bump or edge swipe: a stumble, or a crash if already stumbling (CONTEXT.md: Stumble).
function onBump(now) {
  if (bump(chase, RULES.chase) === 'crash') onCrash(now);
}

attachInput(canvas, onAction);
// The start and crash screens cover the canvas, so a tap on them only starts a run.
startScreen.addEventListener('click', () => onAction('jump'));
crashScreen.addEventListener('click', () => onAction('jump'));

function newRun() {
  player = createPlayer();
  chase = createChase(RULES.chase);
  powerUps = createPowerUps();
  window.__laneRunner.powerUps = powerUps;
  window.__laneRunner.player = player;
  window.__laneRunner.chase = chase;
  track.reset();
  world.reset();
  result = null;
  crashScreen.hidden = true;
  beginRun();
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
  startCatch(chase);
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

  // At high speed one frame can carry the runner past a whole barrier, so a frame runs in small
  // steps and each step checks hits.
  const speed = speedAt(game.time, cfg.runSpeed, RULES.speedRamp);
  const steps = substeps(dt, speed);
  let scroll = 0;
  let groundY = 0;
  for (let i = 0; i < steps; i++) {
    const step = runStep(dt / steps, speed, now);
    scroll += step.scroll;
    groundY = step.groundY;
  }
  // The chase runs with the run, and keeps going after a crash for the catch.
  updateChase(chase, game.state === 'running' || game.state === 'crashed' ? dt : 0, RULES.chase);
  if (game.state === 'crashed' && crashScreen.hidden && crashScreenReady(game, now, RULES.crash.screenDelay)) {
    showCrashScreen();
  }

  world.update(scroll, player, cfg, track.items, game.distance, now, groundY, dt, chase.gap);
  scoreEl.textContent = pad(score(game, RULES));
  coinsEl.textContent = String(game.coins);
  multEl.textContent = `x${scoreMultiplier(powerUps)}`;
  showPowerUps();
  requestAnimationFrame(frame);
}

// One step of the run: move, follow the ground, check hits. Returns how far the world scrolled.
function runStep(dt, speed, now) {
  // Rules that need world sizes as well as the slider values.
  const worldCfg = { ...cfg, roofHeight: RULES.track.roofHeight };
  const prevDistance = game.distance;
  const runDt = advance(game, dt, speed, scoreMultiplier(powerUps));
  track.move(runDt);
  const groundY = groundHeightAt(player.x, game.distance, track.items, worldCfg, { y: player.y, prevDistance });
  updatePlayer(player, runDt, cfg, groundY);
  if (game.state === 'running') {
    track.fill(game.distance + 150, game.distance, speed);
    track.dropBefore(game.distance - 10);
    // Nothing can be hit during the intro leap.
    const hits = player.intro ? noHits()
      : checkHits(player, track.items, game.distance, worldCfg, prevDistance);
    // Only a new bounce is a new bump: still touching the same train while heading back isn't.
    if (hits.sideBump && !hits.crash && bounceBack(player)) onBump(now);
    // The magnet starts pulling coins only while it runs; coins already flying still arrive.
    const magnet = RULES.powerUps.magnet;
    const pulled = pullCoins(track.items, game.distance, runDt, isActive(powerUps, 'magnet') ? magnet : { ...magnet, range: -Infinity });
    game.coins += takeItems(track.items, [...hits.coins, ...pulled]);
    for (const id of hits.powerUps) collect(powerUps, track.items.find((i) => i.id === id).power, RULES.powerUps);
    takeItems(track.items, hits.powerUps);
    tickPowerUps(powerUps, runDt);
    if (hits.crash && game.state === 'running') onCrash(now);
  }
  return { scroll: speed * runDt, groundY };
}

// Running power-ups at the bottom left: an icon and a bar showing the time left.
const POWER_ICONS = { magnet: '🧲', double: '2X' };
function showPowerUps() {
  const names = Object.keys(powerUps.active);
  if (powersEl.dataset.names !== names.join()) {
    powersEl.dataset.names = names.join();
    powersEl.replaceChildren(...names.map((name) => {
      const el = document.createElement('div');
      el.className = 'power';
      el.dataset.name = name;
      el.innerHTML = `<span class="icon">${POWER_ICONS[name]}</span><span class="bar"><span></span></span>`;
      return el;
    }));
  }
  for (const el of powersEl.children) {
    const share = timeLeft(powerUps, el.dataset.name) / RULES.powerUps[el.dataset.name].duration;
    el.querySelector('.bar span').style.width = `${Math.max(0, share) * 100}%`;
  }
}

// Exposed for browser checks during development.
window.__laneRunner = { game, player, cfg, track, chase, powerUps };
requestAnimationFrame(frame);
