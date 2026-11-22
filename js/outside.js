// outside.js — the 3D city you see through the window: a sky far away, rows of
// buildings at different distances, a metro line with a train, trees, drifting
// clouds and a balcony railing. Because it is real 3D, it shifts as the camera
// moves, like a real view. It is always a purple evening, just after sunset.

import * as THREE from 'three';
import { mat, box, cyl, ball, at, makeCanvas, canvasTexture, seededRandom, LAYOUT } from './kit.js';
import { drawSky, EVENING } from './sky.js';

const GROUND = -10;        // the room is a few floors up, so the street is below y = 0

// Paints one building face: a grid of windows. Returns two pictures, one for
// daytime colour and one that holds only the lit windows (used as a night glow).
function facadeTextures(seed, tint) {
  const day = makeCanvas(256, 256), lit = makeCanvas(256, 256);
  const a = day.getContext('2d'), b = lit.getContext('2d');
  const r = seededRandom(seed);
  a.fillStyle = tint; a.fillRect(0, 0, 256, 256);
  b.fillStyle = '#000'; b.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    const px = x * 32 + 7, py = y * 32 + 6;
    a.fillStyle = r() < 0.5 ? '#3c4a5e' : '#4a5a70'; a.fillRect(px, py, 18, 20);
    if (r() < 0.42) {
      const warm = r();
      b.fillStyle = `rgb(255,${190 + Math.floor(warm * 50)},${110 + Math.floor(warm * 80)})`;
      b.fillRect(px, py, 18, 20);
    }
  }
  const t1 = canvasTexture(day), t2 = canvasTexture(lit);
  for (const t of [t1, t2]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return [t1, t2];
}

export function buildOutside(scene) {
  const WIN = LAYOUT.WIN;
  const g = new THREE.Group(); scene.add(g);
  const rnd = seededRandom(26);

  // ---- sky: a huge picture far behind everything ---------------------------------
  const skyCanvas = makeCanvas(2048, 1024);
  const skyTex = canvasTexture(skyCanvas);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(240, 120), new THREE.MeshBasicMaterial({ map: skyTex, fog: false, toneMapped: false }));
  sky.position.set(WIN.x, 24, -75); g.add(sky);

  // ---- buildings --------------------------------------------------------------------
  const variants = [facadeTextures(3, '#8d99ab'), facadeTextures(8, '#a39a90'), facadeTextures(15, '#7f8b9c'), facadeTextures(21, '#9aa3ad')]
    .map(([map, emissiveMap]) => new THREE.MeshStandardMaterial({ map, emissiveMap, emissive: '#ffffff', emissiveIntensity: 0, roughness: 0.9 }));
  const roofMat = mat('#3a3f4a', { roughness: 1 });
  const rows = [
    { z: -11, count: 4, top: [-1.4, 0.7], w: [3, 5], spread: 15 },
    { z: -21, count: 8, top: [0.1, 2.9], w: [4, 7], spread: 26 },
    { z: -35, count: 12, top: [1.0, 5.8], w: [5, 9], spread: 44 },
    { z: -54, count: 14, top: [2.0, 10], w: [6, 11], spread: 62 },
  ];
  for (const row of rows) {
    for (let i = 0; i < row.count; i++) {
      const w = row.w[0] + rnd() * (row.w[1] - row.w[0]);
      const top = row.top[0] + rnd() * (row.top[1] - row.top[0]);
      const h = top - GROUND, d = 4 + rnd() * 4;
      const x = WIN.x - 4 + (i / (row.count - 1) - 0.5) * 2 * row.spread + (rnd() - 0.5) * 3;
      const geo = new THREE.BoxGeometry(w, h, d);
      const uv = geo.attributes.uv;                           // repeat the window grid: one tile is about 5 m
      for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * Math.max(1, Math.round(w / 5)), uv.getY(k) * Math.max(1, Math.round(h / 5)));
      const b = new THREE.Mesh(geo, variants[Math.floor(rnd() * variants.length)]);
      b.position.set(x, GROUND + h / 2, row.z - rnd() * 4);
      g.add(b);
      g.add(at(new THREE.Mesh(new THREE.BoxGeometry(w + 0.2, 0.25, d + 0.2), roofMat), x, top + 0.12, b.position.z));
      if (rnd() < 0.4) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(1.2, 1 + rnd(), 1.2), roofMat), x + (rnd() - 0.5) * w * 0.5, top + 0.7, b.position.z));     // water tank
      if (rnd() < 0.25) g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3, 6), roofMat), x + (rnd() - 0.5) * w * 0.4, top + 1.6, b.position.z)); // antenna
    }
  }

  // ---- trees just below the window: Bengaluru is the "garden city" -----------------------
  const treeMats = [mat('#2f6b3f', { roughness: 1 }), mat('#3d7d4a', { roughness: 1 }), mat('#27593a', { roughness: 1 })];
  for (let i = 0; i < 16; i++) {
    const x = WIN.x - 14 + i * 1.9 + rnd() * 1.2, z = -4.2 - rnd() * 2.6, r = 1.1 + rnd() * 0.9;
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), treeMats[i % 3]);
    crown.position.set(x, -0.9 + rnd() * 1.1, z); crown.scale.y = 0.8 + rnd() * 0.3; g.add(crown);
    const second = new THREE.Mesh(new THREE.IcosahedronGeometry(r * 0.7, 1), treeMats[(i + 1) % 3]);
    second.position.set(x + r * 0.7, crown.position.y - 0.2, z + 0.4); g.add(second);
  }

  // ---- an elevated metro line with a train that passes now and then ------------------------
  const concrete = mat('#8a8f98', { roughness: 0.95 });
  g.add(at(new THREE.Mesh(new THREE.BoxGeometry(90, 0.45, 2.2), concrete), WIN.x, 0.15, -13.5));
  g.add(at(new THREE.Mesh(new THREE.BoxGeometry(90, 0.5, 0.12), concrete), WIN.x, 0.6, -12.45));
  for (let i = -5; i <= 5; i++) g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.9, 10, 0.9), concrete), WIN.x + i * 8, -5, -13.5));
  const train = new THREE.Group(); g.add(train);
  const carMat = mat('#d9dde4', { roughness: 0.5, metalness: 0.3 });
  const stripe = mat('#7a3fa0', { roughness: 0.6 });
  const trainWindows = new THREE.MeshStandardMaterial({ color: '#27303d', emissive: '#ffe2a8', emissiveIntensity: 0.2, roughness: 0.3 });
  for (let i = 0; i < 4; i++) {
    const car = new THREE.Group(); car.position.x = i * 4.25;
    car.add(at(new THREE.Mesh(new THREE.BoxGeometry(4.1, 1.15, 1.3), carMat), 0, 0.6, 0));
    car.add(at(new THREE.Mesh(new THREE.BoxGeometry(4.12, 0.16, 1.32), stripe), 0, 0.2, 0));
    car.add(at(new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.42, 1.33), trainWindows), 0, 0.72, 0));
    train.add(car);
  }
  train.position.set(-80, 0.45, -13.5);
  let trainWait = 4;

  // ---- clouds and a plane with a blinking light -----------------------------------------------
  const puff = makeCanvas(128, 64), pc = puff.getContext('2d');
  for (const [cx, cy, r] of [[40, 38, 24], [64, 30, 28], [90, 38, 22], [56, 42, 20], [76, 44, 20]]) {
    const gr = pc.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    pc.fillStyle = gr; pc.fillRect(0, 0, 128, 64);
  }
  const cloudMat = new THREE.MeshBasicMaterial({ map: canvasTexture(puff), transparent: true, opacity: 0.7, depthWrite: false, fog: false, toneMapped: false });
  const clouds = [];
  for (let i = 0; i < 7; i++) {
    const c = new THREE.Mesh(new THREE.PlaneGeometry(16 + rnd() * 12, 6 + rnd() * 3), cloudMat);
    c.position.set(WIN.x - 60 + rnd() * 90, 6 + rnd() * 16, -66 + rnd() * 6); c.userData.speed = 0.25 + rnd() * 0.35;
    g.add(c); clouds.push(c);
  }
  const plane = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 0.6, 0.5), toneMapped: false, fog: false }));
  plane.position.set(-70, 14, -60); g.add(plane);

  // ---- balcony railing right outside the glass --------------------------------------------------
  const rail = mat('#15171d', { roughness: 0.4, metalness: 0.6 });
  g.add(at(box(WIN.w + 1.2, 0.05, 0.06, rail), WIN.x, WIN.y - WIN.h / 2 + 0.34, -0.95));
  g.add(at(box(WIN.w + 1.2, 0.04, 0.04, rail), WIN.x, WIN.y - WIN.h / 2 - 0.3, -0.95));
  for (let i = 0; i <= 14; i++) g.add(at(cyl(0.012, 0.012, 0.64, rail, 6), WIN.x - WIN.w / 2 - 0.6 + i * ((WIN.w + 1.2) / 14), WIN.y - WIN.h / 2 + 0.02, -0.95));
  g.add(at(box(WIN.w + 1.6, 0.12, 1.1, mat('#6f7480', { roughness: 0.9 })), WIN.x, WIN.y - WIN.h / 2 - 0.42, -0.75));
  // a planter box on the balcony
  g.add(at(box(1.0, 0.2, 0.22, mat('#7a4a32', { roughness: 0.8 })), WIN.x + 0.35, WIN.y - WIN.h / 2 - 0.2, -0.6));
  for (let i = 0; i < 7; i++) {
    const b = ball(0.09 + rnd() * 0.05, treeMats[i % 3], 10);
    g.add(at(b, WIN.x - 0.05 + i * 0.13, WIN.y - WIN.h / 2 - 0.04 + rnd() * 0.06, -0.6));
  }

  g.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });

  // ---- evening colours ------------------------------------------------------------------------------
  // The window only sees a narrow band of the sky picture (about 0.39 to 0.48 across and 0.57 to 0.72 down),
  // so the gradient, moon and stars are placed inside that band.
  function setEvening() {
    drawSky(skyCanvas, { horizon: 0.72, top: 0.5, glowX: 0.44, moonX: 0.415, moonY: 0.585, moonRadius: 9, venusX: 0.462, venusY: 0.61, stars: 700 });
    skyTex.needsUpdate = true;
    for (const m of variants) { m.color.set('#a89cc8'); m.emissiveIntensity = 0.85; }      // lavender-lit walls, lights coming on
    trainWindows.emissiveIntensity = 1.4;
    cloudMat.color.set('#f4a6c6'); cloudMat.opacity = 0.5;                                  // clouds lit pink from below
    for (const [i, m] of treeMats.entries()) m.color.set(['#2c4a3e', '#35554a', '#243f36'][i]);
    plane.visible = true;
    return { haze: EVENING.haze };
  }

  function tick(t, dt) {
    for (const c of clouds) { c.position.x += c.userData.speed * dt; if (c.position.x > WIN.x + 50) c.position.x = WIN.x - 70; }
    if (trainWait > 0) { trainWait -= dt; if (trainWait <= 0) train.position.x = WIN.x - 62; }
    else { train.position.x += dt * 8.5; if (train.position.x > WIN.x + 50) trainWait = 9 + Math.random() * 10; }
    plane.position.x += dt * 2.2; if (plane.position.x > 40) plane.position.x = -70;
    plane.scale.setScalar(Math.sin(t * 5) > 0.6 ? 1 : 0.35);
  }

  return { setEvening, tick };
}
