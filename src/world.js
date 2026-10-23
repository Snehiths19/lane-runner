// The 3D world: scrolling track tiles, side blocks, the runner cutout and the camera.
// The runner stays at z = 0; tiles move toward the camera (+z) and wrap to the back.

import * as THREE from 'three';
import { fovForAspect, followCamera } from './view.js';
import { tunnelsBetween } from './tunnels.js';
import { RULES } from './rules/index.js';

const ROOF = RULES.track.roofHeight;
const RAMP_LENGTH = RULES.track.rowLength;
import { isSliding, laneX } from './player.js';

const TILE_LENGTH = 20;
const TILE_COUNT = 8;
const SKY = 0x8ec9ff;
const BLOCK_COLORS = [0xd9a066, 0xc97b63, 0x9aa5b1, 0x7d8ca3, 0xe0c9a6];
const RUNNER_HEIGHT = 1.6;

// Track pieces are built for lane width 1 and stretched sideways to the live laneWidth.
function buildTrack(materials) {
  const track = new THREE.Group();
  const bed = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.2, TILE_LENGTH), materials.bed);
  bed.position.y = -0.1;
  track.add(bed);
  const railGeo = new THREE.BoxGeometry(0.06, 0.12, TILE_LENGTH);
  for (const lane of [-1, 0, 1]) {
    for (const side of [-0.3, 0.3]) {
      const rail = new THREE.Mesh(railGeo, materials.rail);
      rail.position.set(lane + side, 0.06, 0);
      track.add(rail);
    }
  }
  const tieGeo = new THREE.BoxGeometry(3.2, 0.05, 0.35);
  for (let z = -TILE_LENGTH / 2 + 1; z < TILE_LENGTH / 2; z += 2) {
    const tie = new THREE.Mesh(tieGeo, materials.tie);
    tie.position.set(0, 0.02, z);
    track.add(tie);
  }
  return track;
}

function buildSide(materials) {
  const side = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const block = new THREE.Mesh(materials.blockGeo, materials.blocks[0]);
    block.position.z = -TILE_LENGTH / 2 + 3.5 + i * 6.5;
    side.add(block);
  }
  return side;
}

function randomizeSide(side, materials) {
  for (const block of side.children) {
    const height = 3 + Math.random() * 9;
    block.scale.set(1, height, 1);
    block.position.y = height / 2;
    block.material = materials.blocks[Math.floor(Math.random() * materials.blocks.length)];
  }
}

// A flat cutout: a picture drawn on a canvas, standing on its bottom edge, `height` tall.
function cutout(width, height, draw, px = 128) {
  const c = document.createElement('canvas');
  c.width = px;
  c.height = Math.round((px * height) / width);
  draw(c.getContext('2d'), c.width, c.height);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  const geo = new THREE.PlaneGeometry(width, height);
  geo.translate(0, height / 2, 0); // bottom edge on the ground
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.1 }));
}

// Placeholder character: a simple figure drawn on a canvas, shown as a flat cutout.
function buildRunner() {
  return cutout(RUNNER_HEIGHT / 2, RUNNER_HEIGHT, (g) => {
    g.fillStyle = '#ff7a1a';
    g.strokeStyle = '#3a1d00';
    g.lineWidth = 6;
    g.beginPath(); g.arc(64, 48, 34, 0, Math.PI * 2); g.fill(); g.stroke();
    g.beginPath(); g.roundRect(24, 92, 80, 110, 24); g.fill(); g.stroke();
    g.fillRect(34, 196, 22, 54); g.strokeRect(34, 196, 22, 54);
    g.fillRect(72, 196, 22, 54); g.strokeRect(72, 196, 22, 54);
  });
}

// Placeholder chasers (CONTEXT.md: Chasers): a tall inspector in a blue uniform and cap, and a small
// dog. Real art comes later as skins.
function buildInspector() {
  return cutout(0.95, 1.9, (g) => {
    g.strokeStyle = '#0d1b2a';
    g.lineWidth = 6;
    g.fillStyle = '#f1c27d'; // face
    g.beginPath(); g.arc(64, 62, 30, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#1d3557'; // cap
    g.beginPath(); g.roundRect(30, 22, 68, 24, 8); g.fill(); g.stroke();
    g.fillRect(24, 40, 80, 10);
    g.beginPath(); g.roundRect(18, 98, 92, 110, 20); g.fill(); g.stroke(); // coat
    g.fillStyle = '#f2c200'; // badge
    g.beginPath(); g.arc(84, 124, 8, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#14213d'; // legs
    g.fillRect(32, 200, 24, 52); g.strokeRect(32, 200, 24, 52);
    g.fillRect(72, 200, 24, 52); g.strokeRect(72, 200, 24, 52);
  });
}

function buildDog() {
  return cutout(0.9, 0.7, (g) => {
    g.strokeStyle = '#3b2412';
    g.lineWidth = 5;
    g.fillStyle = '#a0522d';
    g.beginPath(); g.roundRect(18, 40, 76, 40, 16); g.fill(); g.stroke(); // body
    g.beginPath(); g.arc(98, 36, 22, 0, Math.PI * 2); g.fill(); g.stroke(); // head
    g.fillStyle = '#3b2412';
    g.beginPath(); g.ellipse(88, 18, 7, 13, -0.4, 0, Math.PI * 2); g.fill(); // ear
    g.fillStyle = '#a0522d';
    for (const x of [24, 42, 70, 86]) { g.fillRect(x, 74, 10, 24); g.strokeRect(x, 74, 10, 24); } // legs
    g.beginPath(); g.moveTo(20, 50); g.lineTo(4, 30); g.stroke(); // tail
  });
}

// Placeholder looks for track items (real art comes later as skins). Built at lane width 1 and
// stretched sideways to the live lane width; heights match the hitboxes in hits.js.
function stripes(a, b) {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 16;
  const g = c.getContext('2d');
  for (let i = 0; i < 8; i++) {
    g.fillStyle = i % 2 ? b : a;
    g.beginPath(); g.moveTo(i * 8, 0); g.lineTo(i * 8 + 8, 0); g.lineTo(i * 8, 16); g.lineTo(i * 8 - 8, 16); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function buildItemFactory() {
  const m = {
    barrier: new THREE.MeshLambertMaterial({ map: stripes('#f2c200', '#222222') }),
    post: new THREE.MeshLambertMaterial({ color: 0x555555 }),
    sign: new THREE.MeshLambertMaterial({ map: stripes('#d62828', '#ffffff') }),
    train: new THREE.MeshLambertMaterial({ color: 0x8d99a6 }),
    movingTrain: new THREE.MeshLambertMaterial({ color: 0xc0573e }),
    headlight: new THREE.MeshBasicMaterial({ color: 0xfff3b0 }),
    roof: new THREE.MeshLambertMaterial({ color: 0x5f6b77 }),
    window: new THREE.MeshLambertMaterial({ color: 0x2b3a4a }),
    ramp: new THREE.MeshLambertMaterial({ color: 0xb08a5a }),
    coin: new THREE.MeshLambertMaterial({ color: 0xffc31a, emissive: 0xa86f00 }),
  };
  const box = (w, h, d, mat, y) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.y = y;
    return mesh;
  };
  const coinGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.08, 20);
  coinGeo.rotateX(Math.PI / 2);

  // Power-up pickups: a round badge with the power-up's icon, spinning like a coin.
  const BADGES = { magnet: ['#d62828', '🧲'], double: ['#2a9d4b', '2X'] };
  const badgeMats = {};
  function badgeMaterial(power) {
    if (!badgeMats[power]) {
      const [colour, icon] = BADGES[power];
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const g = c.getContext('2d');
      g.fillStyle = colour;
      g.strokeStyle = '#ffffff';
      g.lineWidth = 10;
      g.beginPath(); g.arc(64, 64, 56, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = '#ffffff';
      g.font = 'bold 56px sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(icon, 64, 68);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      badgeMats[power] = new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide });
    }
    return badgeMats[power];
  }
  const badgeGeo = new THREE.PlaneGeometry(0.8, 0.8);

  // kind: an item kind, 'movingTrain' for a train with speed (a different colour and headlights), or
  // 'powerup:<name>' for a power-up pickup.
  return function build(kind) {
    const g = new THREE.Group();
    const body = new THREE.Group(); // stretched to lane width
    g.add(body);
    if (kind === 'low') {
      body.add(box(0.8, 0.3, 0.2, m.barrier, 0.6));
      body.add(box(0.06, 0.6, 0.06, m.post, 0.3).translateX(-0.35), box(0.06, 0.6, 0.06, m.post, 0.3).translateX(0.35));
    } else if (kind === 'over') {
      body.add(box(0.8, 0.8, 0.15, m.sign, 1.4));
      body.add(box(0.06, 1.8, 0.06, m.post, 0.9).translateX(-0.42), box(0.06, 1.8, 0.06, m.post, 0.9).translateX(0.42));
    } else if (kind === 'train' || kind === 'movingTrain') {
      // A train car; its length is set per item.
      // Body plus a darker roof whose top is exactly the runnable roof height.
      const paint = kind === 'movingTrain' ? m.movingTrain : m.train;
      body.add(box(0.8, ROOF - 0.3, 1, paint, (ROOF - 0.3) / 2), box(0.84, 0.3, 1, m.roof, ROOF - 0.15));
      const win = box(0.82, 0.7, 1, m.window, 2.3);
      win.scale.z = 0.9;
      body.add(win);
      if (kind === 'movingTrain') {
        // Headlights on the front (the end facing the runner), placed per item.
        const lights = new THREE.Group();
        lights.add(box(0.12, 0.12, 0.05, m.headlight, 0.9).translateX(-0.25), box(0.12, 0.12, 0.05, m.headlight, 0.9).translateX(0.25));
        body.add(lights);
        g.userData.lights = lights;
      }
    } else if (kind.startsWith('powerup:')) {
      const badge = new THREE.Mesh(badgeGeo, badgeMaterial(kind.slice(8)));
      badge.position.y = 0.9;
      g.add(badge);
      g.userData.coin = badge; // spins like a coin
    } else if (kind === 'ramp') {
      // A plank rising from the track (near end) to the roof (far end).
      const slope = Math.atan2(ROOF, RAMP_LENGTH);
      const plank = box(0.8, 0.15, Math.hypot(ROOF, RAMP_LENGTH), m.ramp, ROOF / 2);
      plank.rotation.x = slope;
      body.add(plank);
    } else {
      const coin = new THREE.Mesh(coinGeo, m.coin);
      coin.position.y = kind === 'highcoin' ? 2.5 : 0.8;
      g.add(coin);
      g.userData.coin = coin;
    }
    g.userData.body = body;
    return g;
  };
}

export function createWorld(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY);
  scene.fog = new THREE.Fog(SKY, 50, TILE_LENGTH * (TILE_COUNT - 1));

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 300);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x556677, 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 1.4);
  sun.position.set(6, 12, 4);
  scene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.MeshLambertMaterial({ color: 0x6b8e4e }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.2;
  scene.add(ground);

  const materials = {
    bed: new THREE.MeshLambertMaterial({ color: 0x8a8a8a }),
    rail: new THREE.MeshLambertMaterial({ color: 0xd0d0d0 }),
    tie: new THREE.MeshLambertMaterial({ color: 0x5a3d2b }),
    blockGeo: new THREE.BoxGeometry(3, 1, 5),
    blocks: BLOCK_COLORS.map((color) => new THREE.MeshLambertMaterial({ color })),
  };

  const tiles = [];
  for (let i = 0; i < TILE_COUNT; i++) {
    const group = new THREE.Group();
    const track = buildTrack(materials);
    const left = buildSide(materials);
    const right = buildSide(materials);
    randomizeSide(left, materials);
    randomizeSide(right, materials);
    group.add(track, left, right);
    group.position.z = TILE_LENGTH - i * TILE_LENGTH;
    scene.add(group);
    tiles.push({ group, track, left, right });
  }

  const runner = buildRunner();
  scene.add(runner);
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.45, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.03;
  scene.add(shadow);

  // Tunnels (looks only): two walls just outside the lanes and a high ceiling, built 1 m long and
  // stretched to each tunnel's length. Two are enough, since tunnels are far apart.
  const tunnelMat = new THREE.MeshLambertMaterial({ color: 0x3d3d46, side: THREE.DoubleSide });
  const portalMat = new THREE.MeshLambertMaterial({ color: 0x7a4b3a });
  const { height: TUNNEL_HEIGHT } = RULES.track.tunnel;
  const tunnelPool = [0, 1].map(() => {
    const t = new THREE.Group();
    const shell = new THREE.Group(); // stretched along the track
    const wallGeo = new THREE.BoxGeometry(0.4, TUNNEL_HEIGHT, 1);
    const left = new THREE.Mesh(wallGeo, tunnelMat);
    const right = new THREE.Mesh(wallGeo, tunnelMat);
    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(1, 0.4, 1), tunnelMat);
    left.position.y = right.position.y = TUNNEL_HEIGHT / 2;
    ceiling.position.y = TUNNEL_HEIGHT + 0.2;
    shell.add(left, right, ceiling);
    const portal = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 0.6), portalMat); // beam over the entrance
    portal.position.y = TUNNEL_HEIGHT + 0.4;
    t.add(shell, portal);
    t.userData = { shell, left, right, ceiling, portal };
    t.visible = false;
    scene.add(t);
    return t;
  });

  function syncTunnels(distance, laneWidth) {
    const half = 1.7 * laneWidth + 0.8;
    const shown = tunnelsBetween(distance - 10, distance + 160, RULES.track.tunnel);
    tunnelPool.forEach((t, i) => {
      const tunnel = shown[i];
      t.visible = Boolean(tunnel);
      if (!tunnel) return;
      const { shell, left, right, ceiling, portal } = t.userData;
      const length = tunnel.end - tunnel.start;
      shell.scale.z = length;
      left.position.x = -half;
      right.position.x = half;
      ceiling.scale.x = 2 * half + 0.4;
      portal.scale.x = 2 * half + 0.8;
      portal.position.z = length / 2; // the entrance, facing the runner
      t.position.z = -((tunnel.start + tunnel.end) / 2 - distance);
    });
  }

  const inspector = buildInspector();
  const dog = buildDog();
  scene.add(inspector, dog);
  let chaseX = 0; // the chasers follow the runner sideways a little behind

  const buildItem = buildItemFactory();
  const itemMeshes = new Map(); // item id -> mesh
  const itemLayer = new THREE.Group();
  scene.add(itemLayer);

  // Shows the track items (obstacles, coins) at their place relative to the runner's distance.
  // A coin the magnet is pulling (item.pull 0 → 1) flies from its place to the runner.
  function syncItems(items, distance, cfg, time, player) {
    const live = new Set();
    for (const item of items) {
      live.add(item.id);
      let mesh = itemMeshes.get(item.id);
      if (!mesh) {
        mesh = buildItem(item.speed ? 'movingTrain' : item.kind === 'powerup' ? `powerup:${item.power}` : item.kind);
        if (item.kind === 'train') mesh.userData.body.scale.z = item.end - item.start;
        // Undo the body's stretch so the headlights stay small, and put them on the front face.
        if (mesh.userData.lights) {
          mesh.userData.lights.scale.z = 1 / (item.end - item.start);
          mesh.userData.lights.position.z = 0.5;
        }
        itemMeshes.set(item.id, mesh);
        itemLayer.add(mesh);
      }
      mesh.userData.body.scale.x = cfg.laneWidth;
      mesh.position.set(laneX(item.lane, cfg), item.base ?? 0, -((item.start + item.end) / 2 - distance));
      if (item.pull) {
        const t = item.pull * item.pull; // speeds up as it flies in
        mesh.position.x += (player.x - mesh.position.x) * t;
        mesh.position.y += (player.y - mesh.position.y) * t;
        mesh.position.z += (0 - mesh.position.z) * t;
      }
      if (mesh.userData.coin) mesh.userData.coin.rotation.y = time * 3;
    }
    for (const [id, mesh] of itemMeshes) {
      if (!live.has(id)) {
        itemLayer.remove(mesh);
        itemMeshes.delete(id);
      }
    }
  }

  let laneWidth = null;
  let knockBack = 0;

  // scroll: how far the world moved this frame (0 while not running).
  // items/distance: what's on the track and how far the runner has gone; time: seconds, for coin spin.
  // groundY: surface height under the runner (track or roof); the camera follows it smoothly.
  // chaseGap: how far behind the runner the inspector and dog are (hidden when beyond the camera).
  let cameraSurface = 0;
  const cam = { x: 0, lift: 0 }; // camera follow (CAM-1): sideways lag and jump lift
  function update(scroll, player, cfg, items = [], distance = 0, time = 0, groundY = 0, dt = 0, chaseGap = Infinity) {
    cameraSurface += (groundY - cameraSurface) * Math.min(1, dt / 0.25 * 3);
    syncItems(items, distance, cfg, time, player);
    syncTunnels(distance, cfg.laneWidth);
    if (cfg.laneWidth !== laneWidth) {
      laneWidth = cfg.laneWidth;
      for (const t of tiles) {
        t.track.scale.x = laneWidth;
        t.left.position.x = -(1.7 * laneWidth + 2.5);
        t.right.position.x = 1.7 * laneWidth + 2.5;
      }
    }

    for (const t of tiles) {
      t.group.position.z += scroll;
      if (t.group.position.z > TILE_LENGTH) {
        t.group.position.z -= TILE_COUNT * TILE_LENGTH;
        randomizeSide(t.left, materials);
        randomizeSide(t.right, materials);
      }
    }

    runner.position.set(player.x, player.y, knockBack);
    runner.scale.y = isSliding(player) ? 0.5 : 1;
    shadow.position.x = player.x;
    shadow.position.y = groundY + 0.03;
    shadow.scale.setScalar(1 - Math.min((player.y - groundY) / 5, 0.6));

    followCamera(cam, { x: player.x * 0.5, lift: RULES.camera.jumpFollow * Math.max(0, player.y - groundY) }, dt, RULES.camera);
    camera.position.set(cam.x, 3.6 + cameraSurface + cam.lift, 6);
    camera.lookAt(cam.x, 1.4 + cameraSurface + cam.lift, -12);

    chaseX += (player.x - chaseX) * Math.min(1, dt * 6);
    const chaseZ = knockBack + chaseGap;
    inspector.visible = dog.visible = chaseZ < camera.position.z - 0.5;
    inspector.position.set(chaseX - 0.55, cameraSurface, chaseZ);
    dog.position.set(chaseX + 0.6, cameraSurface, chaseZ - 0.5);

    // Cutouts always face the camera, turning only around the vertical axis.
    for (const c of [runner, inspector, dog]) {
      c.rotation.y = Math.atan2(camera.position.x - c.position.x, camera.position.z - c.position.z);
    }

    renderer.render(scene, camera);
  }

  function resize(width, height) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = fovForAspect(camera.aspect);
    camera.updateProjectionMatrix();
  }

  // A crash knocks the runner back a little; a new run puts everything back.
  function crashed() { knockBack = 0.8; }
  function reset() {
    knockBack = 0;
    cam.x = 0;
    cam.lift = 0;
    for (const mesh of itemMeshes.values()) itemLayer.remove(mesh);
    itemMeshes.clear();
  }

  return { update, resize, crashed, reset };
}
