// The 3D world: scrolling track tiles, side blocks, the runner cutout and the camera.
// The runner stays at z = 0; tiles move toward the camera (+z) and wrap to the back.

import * as THREE from 'three';
import { fovForAspect } from './view.js';
import { isSliding } from './player.js';

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

// Placeholder character: a simple figure drawn on a canvas, shown as a flat cutout.
function buildRunner() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#ff7a1a';
  g.strokeStyle = '#3a1d00';
  g.lineWidth = 6;
  g.beginPath(); g.arc(64, 48, 34, 0, Math.PI * 2); g.fill(); g.stroke();
  g.beginPath(); g.roundRect(24, 92, 80, 110, 24); g.fill(); g.stroke();
  g.fillRect(34, 196, 22, 54); g.strokeRect(34, 196, 22, 54);
  g.fillRect(72, 196, 22, 54); g.strokeRect(72, 196, 22, 54);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  const geo = new THREE.PlaneGeometry(RUNNER_HEIGHT / 2, RUNNER_HEIGHT);
  geo.translate(0, RUNNER_HEIGHT / 2, 0); // bottom edge on the ground
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.1 }));
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

  let laneWidth = null;

  // scroll: how far the world moved this frame (0 while not running).
  function update(scroll, player, cfg) {
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

    runner.position.set(player.x, player.y, 0);
    runner.scale.y = isSliding(player) ? 0.5 : 1;
    shadow.position.x = player.x;
    shadow.scale.setScalar(1 - Math.min(player.y / 5, 0.6));

    camera.position.set(player.x * 0.5, 3.6, 6);
    camera.lookAt(player.x * 0.5, 1.4, -12);
    // Cutouts always face the camera, turning only around the vertical axis.
    runner.rotation.y = Math.atan2(camera.position.x - runner.position.x, camera.position.z);

    renderer.render(scene, camera);
  }

  function resize(width, height) {
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = fovForAspect(camera.aspect);
    camera.updateProjectionMatrix();
  }

  return { update, resize };
}
