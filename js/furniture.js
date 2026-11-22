// furniture.js — everything in the room that is NOT a clickable project:
// walls with the window opening, curtains, floor and rug, the wood panel and
// shelves, the standing desk, the chair, the lamps (and the light they give),
// the plants, and small touches like the wall clock and floating dust.

import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { EVENING } from './sky.js';
import { ACCENT, FONT, LAYOUT, mat, metal, glow, glass, shadow, box, rbox, cyl, ball, torus, at, rot, tube, rod, leaf, makeCanvas, canvasTexture, seededRandom } from './kit.js';

RectAreaLightUniformsLib.init();       // needed once so soft "area" lights work

const { PX, DESK_Y, DESK_W, WIN, WALL_LEFT, WALL_RIGHT, SHELF_TOP, SHELF_LOW } = LAYOUT;

// ---- textures drawn with code -------------------------------------------------------
function woodFloorTexture() {
  const c = makeCanvas(1024, 1024), g = c.getContext('2d'), r = seededRandom(4);
  g.fillStyle = '#3a2a20'; g.fillRect(0, 0, 1024, 1024);
  const pw = 128;                                   // plank width in pixels
  for (let col = 0; col < 8; col++) {
    let y = -r() * 300;
    while (y < 1024) {
      const len = 300 + r() * 380, shade = r();
      g.fillStyle = `rgb(${92 + shade * 34},${62 + shade * 24},${42 + shade * 16})`;
      g.fillRect(col * pw + 1.5, y + 1.5, pw - 3, len - 3);
      g.strokeStyle = 'rgba(40,24,14,0.16)'; g.lineWidth = 1;     // wood grain
      for (let k = 0; k < 9; k++) {
        const gx = col * pw + 8 + r() * (pw - 16);
        g.beginPath(); g.moveTo(gx, y + 4); g.bezierCurveTo(gx + (r() - 0.5) * 12, y + len * 0.33, gx + (r() - 0.5) * 12, y + len * 0.66, gx + (r() - 0.5) * 6, y + len - 4); g.stroke();
      }
      y += len;
    }
  }
  const t = canvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

function rugTexture() {
  const c = makeCanvas(512, 340), g = c.getContext('2d'), r = seededRandom(11);
  g.fillStyle = '#8f8473'; g.fillRect(0, 0, 512, 340);
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${90 + r() * 60},${80 + r() * 50},${66 + r() * 40},0.10)`; g.fillRect(r() * 512, r() * 340, 3, 1.5); }
  g.strokeStyle = '#5f5446'; g.lineWidth = 6; g.strokeRect(22, 22, 468, 296);
  g.strokeStyle = '#3f6f66'; g.lineWidth = 3; g.strokeRect(36, 36, 440, 268);
  g.strokeStyle = 'rgba(70,60,50,0.55)'; g.lineWidth = 2;
  for (let x = 70; x < 460; x += 44) { g.beginPath(); g.moveTo(x, 60); g.lineTo(x + 22, 82); g.lineTo(x + 44, 60); g.stroke(); g.beginPath(); g.moveTo(x, 280); g.lineTo(x + 22, 258); g.lineTo(x + 44, 280); g.stroke(); }
  return canvasTexture(c);
}

function keyboardTexture() {
  const c = makeCanvas(512, 168), g = c.getContext('2d');
  g.fillStyle = '#23262e'; g.fillRect(0, 0, 512, 168);
  for (let row = 0; row < 5; row++) for (let k = 0; k < 15; k++) {
    const special = (row === 4 && k > 3 && k < 10);
    if (special && k > 4) continue;
    const w = special ? 196 : 28;
    g.fillStyle = (row === 0 && k === 0) || (row === 2 && k === 13) ? ACCENT : '#3a3e49';
    g.beginPath(); g.roundRect(10 + k * 33, 8 + row * 31, w, 26, 5); g.fill();
  }
  return canvasTexture(c);
}

function clockFace() {
  const c = makeCanvas(256, 256), g = c.getContext('2d');
  g.fillStyle = '#f1ece2'; g.beginPath(); g.arc(128, 128, 126, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#23262e';
  for (let i = 0; i < 12; i++) {
    g.save(); g.translate(128, 128); g.rotate((i / 12) * Math.PI * 2);
    g.fillRect(-3, -112, i % 3 === 0 ? 6 : 3, i % 3 === 0 ? 24 : 14); g.restore();
  }
  return canvasTexture(c);
}

function deskDisplay() {
  const c = makeCanvas(96, 40), g = c.getContext('2d');
  g.fillStyle = '#05070a'; g.fillRect(0, 0, 96, 40);
  g.fillStyle = ACCENT; g.font = `700 28px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('86', 48, 22);
  return canvasTexture(c);
}

// =============================================================================
export function buildFurniture(scene) {
  const out = { ticks: [], refreshers: [] };
  const add = (o) => { scene.add(o); return o; };
  const rnd = seededRandom(61);

  // ---- floor and rug -------------------------------------------------------------------
  const floorTex = woodFloorTexture(); floorTex.repeat.set(9, 7);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 14), mat('#ffffff', { map: floorTex, roughness: 0.3, metalness: 0.0, envMapIntensity: 1.25 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0.35, 0, 6.7); floor.receiveShadow = true; add(floor);
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(3.7, 2.4), mat('#ffffff', { map: rugTexture(), roughness: 1, envMapIntensity: 0.2 }));
  rug.rotation.x = -Math.PI / 2; rug.position.set(PX - 0.1, 0.008, 1.8); rug.receiveShadow = true; add(rug);

  // ---- walls, with a real opening for the window ---------------------------------------------
  const wallMat = mat('#b3aba2', { roughness: 0.92, envMapIntensity: 0.4 });
  const T = 0.3, wl = WALL_LEFT - T, wr = WALL_RIGHT + T;
  const wx0 = WIN.x - WIN.w / 2, wx1 = WIN.x + WIN.w / 2, wy0 = WIN.y - WIN.h / 2, wy1 = WIN.y + WIN.h / 2;
  add(at(box(wx0 - wl, 10, T, wallMat), (wx0 + wl) / 2, 5, -T / 2));              // left of the window
  add(at(box(wr - wx1, 10, T, wallMat), (wr + wx1) / 2, 5, -T / 2));              // right of the window
  add(at(box(WIN.w, 10 - wy1, T, wallMat), WIN.x, (10 + wy1) / 2, -T / 2));       // above
  add(at(box(WIN.w, wy0, T, wallMat), WIN.x, wy0 / 2, -T / 2));                   // below
  add(at(box(T, 10, 14, wallMat), WALL_LEFT - T / 2, 5, 6.7));
  add(at(box(T, 10, 14, wallMat), WALL_RIGHT + T / 2, 5, 6.7));
  const skirt = mat('#ece7de', { roughness: 0.6 });
  add(at(box(wr - wl, 0.13, 0.025, skirt), (wl + wr) / 2, 0.065, 0.0125));
  add(at(box(0.025, 0.13, 14, skirt), WALL_LEFT + 0.0125, 0.065, 6.7));
  add(at(box(0.025, 0.13, 14, skirt), WALL_RIGHT - 0.0125, 0.065, 6.7));

  // ---- window frame, glass and sill -------------------------------------------------------------
  const frame = mat('#17191f', { roughness: 0.4, metalness: 0.5 });
  const fz = -0.14;
  add(at(box(WIN.w, 0.06, 0.09, frame), WIN.x, wy1 - 0.03, fz));
  add(at(box(WIN.w, 0.06, 0.09, frame), WIN.x, wy0 + 0.03, fz));
  add(at(box(0.06, WIN.h, 0.09, frame), wx0 + 0.03, WIN.y, fz));
  add(at(box(0.06, WIN.h, 0.09, frame), wx1 - 0.03, WIN.y, fz));
  add(at(box(0.05, WIN.h, 0.08, frame), WIN.x, WIN.y, fz));
  add(at(box(0.03, 0.12, 0.05, metal('#9aa0ab')), WIN.x + 0.06, WIN.y - 0.1, fz + 0.06));       // window handle
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(WIN.w - 0.1, WIN.h - 0.1), glass(0.1)); pane.position.set(WIN.x, WIN.y, fz); add(pane);
  add(at(rbox(WIN.w + 0.36, 0.05, 0.34, mat('#ece7de', { roughness: 0.5 }), 0.012), WIN.x, wy0 - 0.02, 0.06));
  // a little cactus and a watering can's worth of charm on the sill
  add(at(cyl(0.07, 0.055, 0.1, mat('#c96f4a', { roughness: 0.8 })), wx0 + 0.3, wy0 + 0.055, 0.1));
  const cactus = mat('#4f8a55', { roughness: 0.8 });
  const cb = ball(0.06, cactus, 12); cb.scale.y = 1.5; add(at(cb, wx0 + 0.3, wy0 + 0.18, 0.1));
  const cb2 = ball(0.03, cactus, 10); cb2.scale.y = 1.4; add(at(cb2, wx0 + 0.355, wy0 + 0.2, 0.1));

  // ---- curtains on a rod, swaying a little ---------------------------------------------------------
  const rodY = wy1 + 0.24, rodZ = 0.16;
  const brass = metal('#8f744a', 0.35);
  add(rod([wx0 - 0.5, rodY, rodZ], [wx1 + 0.5, rodY, rodZ], 0.016, brass));
  add(at(ball(0.035, brass, 12), wx0 - 0.52, rodY, rodZ)); add(at(ball(0.035, brass, 12), wx1 + 0.52, rodY, rodZ));
  for (const bx of [wx0 - 0.42, wx1 + 0.42]) add(at(box(0.03, 0.03, 0.16, brass), bx, rodY, 0.08));
  const linen = mat('#e6dccb', { roughness: 1, side: THREE.DoubleSide, envMapIntensity: 0.3 });
  const curtains = [];
  for (const cx of [wx0 - 0.12, wx1 + 0.12]) {
    const h = rodY - 0.1, w = 0.5;
    const geo = new THREE.PlaneGeometry(w, h, 26, 12);
    const m = shadow(new THREE.Mesh(geo, linen)); m.position.set(cx, rodY - h / 2 - 0.03, rodZ); add(m);
    curtains.push({ geo, phase: cx });
    for (let i = 0; i < 6; i++) add(rot(at(torus(0.026, 0.005, brass, 12), cx - w / 2 + 0.05 + i * (w - 0.1) / 5, rodY, rodZ), 0, Math.PI / 2, 0));
  }
  let curtainClock = 0;
  const shapeCurtains = (t) => {
    for (const { geo, phase } of curtains) {
      const p = geo.attributes.position, uvs = geo.attributes.uv;
      for (let i = 0; i < p.count; i++) {
        const u = uvs.getX(i), v = uvs.getY(i);              // v = 1 at the rod, 0 at the floor
        const loose = 1 - v;
        p.setZ(i, Math.sin(u * Math.PI * 9) * (0.035 + 0.02 * loose) + Math.sin(t * 0.9 + u * 5 + phase) * 0.022 * loose * loose);
      }
      p.needsUpdate = true; geo.computeVertexNormals();
    }
  };
  shapeCurtains(0);
  out.ticks.push((t, dt) => { curtainClock += dt; if (curtainClock > 0.05) { curtainClock = 0; shapeCurtains(t); } });

  // ---- light from outside: a soft glow from the whole window, plus a soft beam that
  //      throws the window's shape (and its frame's shadow) across the floor. Colours are set further down. ------
  const windowGlow = new THREE.RectAreaLight('#ffffff', 4, WIN.w, WIN.h);
  windowGlow.position.set(WIN.x, WIN.y, 0.08); windowGlow.lookAt(WIN.x, WIN.y, 5); add(windowGlow);
  const sun = new THREE.SpotLight('#ffffff', 400, 34, 0.3, 0.35, 1.1);
  sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -0.0006; sun.shadow.camera.near = 3; sun.shadow.camera.far = 30;
  add(sun); add(sun.target);
  const hemi = new THREE.HemisphereLight('#dfe6ff', '#6b5646', 0.9); add(hemi);

  // ---- slatted wood panel and two shelves with warm LED strips ------------------------------------------
  const panelW = 3.9, panelH = 3.8;
  add(at(box(panelW, panelH, 0.04, mat('#22170f', { roughness: 0.8 })), PX, panelH / 2, 0.02));
  const nSlats = 34, pitch = panelW / nSlats;
  const slats = new THREE.InstancedMesh(new THREE.BoxGeometry(pitch * 0.62, panelH, 0.05), mat('#ffffff', { roughness: 0.5, envMapIntensity: 0.45 }), nSlats);
  const m4 = new THREE.Matrix4(), tint = new THREE.Color();
  for (let i = 0; i < nSlats; i++) {
    m4.setPosition(PX - panelW / 2 + pitch * (i + 0.5), panelH / 2, 0.065); slats.setMatrixAt(i, m4);
    const k = rnd(); slats.setColorAt(i, tint.setRGB(0.52 + k * 0.1, 0.33 + k * 0.07, 0.2 + k * 0.05, THREE.SRGBColorSpace));
  }
  slats.castShadow = true; slats.receiveShadow = true; add(slats);
  add(at(box(panelW + 0.06, 0.05, 0.1, mat('#22170f')), PX, panelH + 0.025, 0.05));

  const shelfMat = mat('#1a130e', { roughness: 0.5 });
  const ledMat = glow(3.4, 2.0, 0.95);
  const shelfW = 3.5;
  for (const y of [SHELF_TOP, SHELF_LOW]) {
    add(at(rbox(shelfW, 0.05, 0.38, shelfMat, 0.008), PX, y, 0.28));
    for (const dx of [-1.3, 0, 1.3]) add(at(box(0.03, 0.03, 0.24, metal('#101116')), PX + dx, y - 0.04, 0.2));       // brackets
    add(at(new THREE.Mesh(new THREE.BoxGeometry(shelfW - 0.1, 0.012, 0.018), ledMat), PX, y - 0.032, 0.13));
    for (const dx of [-0.95, 0.95]) { const p = new THREE.PointLight('#ffb062', 1.25, 2.6, 1.8); p.position.set(PX + dx, y - 0.16, 0.42); add(p); }
  }

  // ---- standing desk: two telescoping legs, T-shaped feet, a height keypad ---------------------------------
  {
    const g = new THREE.Group(); g.position.set(PX, 0, 0.72); add(g);
    const walnut = mat('#6a4630', { roughness: 0.34, envMapIntensity: 0.9 });
    const black = mat('#111216', { roughness: 0.45, metalness: 0.5 });
    const silver = metal('#c2c6cd', 0.3);
    g.add(at(rbox(DESK_W, 0.045, 0.95, walnut, 0.014), 0, DESK_Y - 0.0225, 0));
    for (const dz of [-0.26, 0.26]) g.add(at(box(DESK_W - 0.5, 0.035, 0.05, black), 0, DESK_Y - 0.063, dz));
    const legX = DESK_W / 2 - 0.34, lowerH = 0.52, upperH = DESK_Y - 0.08 - lowerH - 0.03;
    for (const sx of [-1, 1]) {
      g.add(at(rbox(0.09, 0.03, 0.8, black, 0.01), sx * legX, 0.03, 0));                         // foot
      for (const dz of [-0.36, 0.36]) g.add(at(cyl(0.025, 0.025, 0.014, black, 12), sx * legX, 0.007, dz));
      g.add(at(box(0.095, lowerH, 0.065, black), sx * legX, 0.045 + lowerH / 2, 0));               // outer (lower) column
      g.add(at(box(0.07, upperH + 0.08, 0.045, silver), sx * legX, 0.045 + lowerH + upperH / 2, 0)); // inner (upper) column
      g.add(at(rbox(0.11, 0.07, 0.34, black, 0.012), sx * legX, DESK_Y - 0.115, 0));               // motor housing
    }
    g.add(at(box(legX * 2, 0.045, 0.04, black), 0, DESK_Y - 0.12, -0.12));                        // cross bar
    g.add(at(box(1.3, 0.07, 0.13, black), 0, DESK_Y - 0.13, -0.36));                              // cable tray
    // keypad with a little height read-out
    const pad = new THREE.Group(); pad.position.set(DESK_W / 2 - 0.42, DESK_Y - 0.062, 0.475); g.add(pad);
    pad.add(rbox(0.2, 0.032, 0.06, black, 0.008));
    const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.02), new THREE.MeshBasicMaterial({ map: deskDisplay(), toneMapped: false })); disp.position.set(-0.06, 0, 0.0305); pad.add(disp);
    for (let i = 0; i < 4; i++) pad.add(at(rbox(0.018, 0.014, 0.004, mat(i < 2 ? '#c2c6cd' : '#4a4e59'), 0.002), -0.01 + i * 0.026, 0, 0.031));
    // power cable down the left leg to a wall socket
    g.add(tube([[-0.5, DESK_Y - 0.15, -0.36], [-legX + 0.06, DESK_Y - 0.3, -0.2], [-legX + 0.07, 0.3, -0.1], [-legX - 0.2, 0.03, -0.3], [-legX - 0.5, 0.22, -0.69]], 0.008, mat('#0c0d10', { roughness: 0.6 }), 30));
    add(at(rbox(0.12, 0.12, 0.012, mat('#ece7de', { roughness: 0.5 }), 0.01), PX - legX - 0.5, 0.26, 0.008));

    // desk mat, keyboard and mouse
    g.add(at(rbox(1.25, 0.004, 0.42, mat('#191b21', { roughness: 0.95 }), 0.002), 0.12, DESK_Y + 0.002, 0.02));
    const kb = new THREE.Group(); kb.position.set(-0.02, DESK_Y + 0.005, 0.0); kb.rotation.x = 0.06; g.add(kb);
    kb.add(at(rbox(0.5, 0.022, 0.17, mat('#16181d', { roughness: 0.5 }), 0.006), 0, 0.011, 0));
    const keys = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.155), mat('#ffffff', { map: keyboardTexture(), roughness: 0.6 })); keys.rotation.x = -Math.PI / 2; keys.position.y = 0.0226; kb.add(keys);
    const mouse = ball(0.034, mat('#ece7de', { roughness: 0.35 }), 16); mouse.scale.set(0.85, 0.55, 1.3); g.add(at(mouse, 0.5, DESK_Y + 0.02, 0.02));
    // sim-racing pedals on the floor under the desk
    const ped = new THREE.Group(); ped.position.set(0, 0, 0.3); g.add(ped);
    ped.add(at(rbox(0.42, 0.025, 0.3, black, 0.008), 0, 0.0125, 0));
    for (const [dx, col] of [[-0.1, '#c2c6cd'], [0.1, '#c2c6cd']]) {
      ped.add(rot(at(rbox(0.07, 0.17, 0.012, metal(col, 0.3), 0.004), dx, 0.11, -0.02), -0.6, 0, 0));
      ped.add(at(box(0.03, 0.06, 0.03, black), dx, 0.045, -0.08));
    }
  }

  // ---- desk lamp (left back corner of the desk) --------------------------------------------------------------
  {
    const bx = PX - DESK_W / 2 + 0.22, bz = 0.44, y0 = DESK_Y;
    const blk = mat('#16181d', { roughness: 0.4, metalness: 0.4 }), brassy = metal('#b08a52', 0.3);
    add(at(cyl(0.085, 0.095, 0.022, blk, 28), bx, y0 + 0.011, bz));
    const elbow = [bx - 0.1, y0 + 0.42, bz + 0.02], head = [bx + 0.22, y0 + 0.62, bz + 0.16];
    add(rod([bx, y0 + 0.02, bz], elbow, 0.009, brassy)); add(rod(elbow, head, 0.009, brassy));
    add(at(ball(0.018, blk, 10), ...elbow));
    const shade = new THREE.Group(); shade.position.set(...head); shade.rotation.set(0.35, 0, -0.5); add(shade);
    const cone = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.095, 0.13, 24, 1, true), mat('#16181d', { roughness: 0.4, metalness: 0.4, side: THREE.DoubleSide })));
    shade.add(cone); shade.add(at(cyl(0.03, 0.03, 0.02, blk, 16), 0, 0.07, 0));
    shade.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.032, 14, 10), glow(3.0, 2.3, 1.4)), 0, -0.03, 0));
    const lamp = new THREE.SpotLight('#ffc98c', 4.5, 2.6, 0.85, 0.9, 1.6);
    lamp.position.set(head[0], head[1] - 0.03, head[2]); lamp.target.position.set(bx + 0.42, y0, bz + 0.42); add(lamp); add(lamp.target);
  }

  // ---- office chair, pushed back and turned towards the desk ----------------------------------------------------
  {
    const g = new THREE.Group(); g.position.set(PX - 1.62, 0, 2.5); g.rotation.y = -0.8; add(g);
    const fabric = mat('#8d8478', { roughness: 0.95, envMapIntensity: 0.3 });
    const blk = mat('#15171c', { roughness: 0.45, metalness: 0.3 });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.3;
      const spoke = rbox(0.32, 0.035, 0.05, blk, 0.012); spoke.position.set(Math.cos(a) * 0.16, 0.085, Math.sin(a) * 0.16); spoke.rotation.y = -a; g.add(spoke);
      // caster: a swivel fork holding two small wheels
      const cx = Math.cos(a) * 0.31, cz = Math.sin(a) * 0.31;
      g.add(at(cyl(0.012, 0.012, 0.03, blk, 10), cx, 0.075, cz));
      const fork = new THREE.Group(); fork.position.set(cx, 0.033, cz); fork.rotation.y = -a + 0.6; g.add(fork);
      fork.add(at(rbox(0.05, 0.03, 0.03, blk, 0.008), 0, 0.022, 0));
      for (const s of [-1, 1]) fork.add(rot(at(cyl(0.026, 0.026, 0.014, mat('#0c0d10', { roughness: 0.55 }), 16), 0, 0, s * 0.012), Math.PI / 2, 0, 0));
    }
    g.add(at(cyl(0.045, 0.05, 0.12, blk, 16), 0, 0.14, 0));
    g.add(at(cyl(0.026, 0.026, 0.26, metal('#c2c6cd', 0.25), 16), 0, 0.31, 0));
    g.add(at(rbox(0.24, 0.05, 0.24, blk, 0.012), 0, 0.445, 0));
    g.add(at(rbox(0.52, 0.1, 0.5, fabric, 0.045), 0, 0.52, 0));                    // seat
    g.add(at(rbox(0.5, 0.012, 0.48, mat('#6f675d', { roughness: 0.95 }), 0.006), 0, 0.572, 0));   // seat piping
    g.add(at(rbox(0.3, 0.035, 0.3, blk, 0.01), 0, 0.46, 0.0));                     // tilt mechanism
    g.add(rot(at(rbox(0.16, 0.012, 0.02, blk, 0.005), 0.2, 0.46, -0.05), 0, 0.25, -0.15));      // height lever
    g.add(at(ball(0.014, blk, 8), 0.28, 0.45, -0.07));
    const back = new THREE.Group(); back.position.set(0, 0.56, 0.25); back.rotation.x = 0.13; g.add(back);
    back.add(at(rbox(0.07, 0.36, 0.035, blk, 0.012), 0, 0.14, 0.04));                // spine
    back.add(at(rbox(0.48, 0.5, 0.075, fabric, 0.045), 0, 0.42, 0));                 // backrest
    back.add(at(rbox(0.36, 0.1, 0.085, fabric, 0.04), 0, 0.22, -0.01));              // lumbar pad
    for (const y of [0.3, 0.42, 0.54]) back.add(at(box(0.4, 0.006, 0.004, mat('#6f675d', { roughness: 0.95 })), 0, y, -0.039));   // stitched channels
    back.add(at(rbox(0.05, 0.16, 0.03, blk, 0.01), 0, 0.74, 0.035));               // headrest post
    back.add(at(rbox(0.3, 0.12, 0.07, fabric, 0.035), 0, 0.82, 0.0));              // headrest
    for (const sx of [-1, 1]) {
      g.add(at(rbox(0.035, 0.2, 0.04, blk, 0.01), sx * 0.3, 0.63, 0.04));
      g.add(at(rbox(0.07, 0.03, 0.27, mat('#1e2026', { roughness: 0.7 }), 0.012), sx * 0.3, 0.74, 0.0));
    }
  }

  // ---- studio softbox on a light stand: the main ("key") light of the room ---------------------------------------
  //      All three tripod legs point forwards or sideways, so none of them pass through a wall.
  const socket = [WALL_RIGHT - 0.55, 0.3];          // wall socket (x, y) both right-hand lamps plug into
  {
    const base = new THREE.Vector3(4.5, 0, 0.62);
    const headPos = new THREE.Vector3(base.x - 0.1, 3.0, base.z + 0.34);
    const aim = new THREE.Vector3(PX - 0.1, 1.05, 0.7);
    const blk = mat('#121317', { roughness: 0.5, metalness: 0.4 });
    const alu = metal('#a3a9b3', 0.32);
    const rubber = mat('#1b1c21', { roughness: 0.85 });
    const P = (v) => [v.x, v.y, v.z];
    const hubY = 0.62, braceY = 0.3;
    const feet = [];
    for (let i = 0; i < 3; i++) {
      const a = Math.PI / 2 + (i / 3) * Math.PI * 2;             // front, back-left, back-right
      const dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
      const top = base.clone().addScaledVector(dir, 0.03).setY(hubY);
      const foot = base.clone().addScaledVector(dir, 0.48).setY(0.025);
      feet.push(foot);
      add(rod(P(top), P(foot), 0.011, blk));                                         // leg
      add(rod([base.x, braceY, base.z], P(top.clone().lerp(foot, 0.5)), 0.006, blk));  // brace back to the pole
      add(at(cyl(0.017, 0.021, 0.025, rubber, 12), foot.x, 0.0125, foot.z));            // rubber foot
    }
    add(at(cyl(0.034, 0.034, 0.075, blk, 16), base.x, hubY, base.z));                  // leg hub
    add(at(cyl(0.028, 0.028, 0.045, blk, 16), base.x, braceY, base.z));                // sliding brace collar
    // a sandbag over the front leg keeps it steady
    const bag = rbox(0.2, 0.06, 0.13, mat('#3b3a35', { roughness: 0.95 }), 0.028);
    bag.position.copy(base.clone().lerp(feet[0], 0.84)).setY(0.115); bag.rotation.y = Math.PI / 2; add(bag);
    add(at(box(0.012, 0.03, 0.14, mat('#54524a', { roughness: 0.9 })), bag.position.x, 0.15, bag.position.z));
    // telescoping pole: three sections, thinner as they go up, with a locking knob at each joint
    for (const [y0, y1, r, m] of [[0.25, 1.36, 0.019, blk], [1.36, 2.26, 0.015, alu], [2.26, 2.96, 0.012, alu]]) add(rod([base.x, y0, base.z], [base.x, y1, base.z], r, m));
    for (const y of [1.36, 2.26]) {
      add(at(cyl(0.025, 0.025, 0.065, blk, 16), base.x, y, base.z));
      add(rod([base.x + 0.02, y, base.z], [base.x + 0.06, y, base.z], 0.005, blk));
      add(rot(at(cyl(0.017, 0.017, 0.016, rubber, 12), base.x + 0.068, y, base.z), 0, 0, Math.PI / 2));
    }
    // tilt bracket at the top, with its own knob
    add(rod([base.x, 2.96, base.z], [headPos.x, headPos.y - 0.13, headPos.z - 0.14], 0.012, alu));
    add(at(ball(0.026, blk, 12), headPos.x, headPos.y - 0.13, headPos.z - 0.14));
    const head = new THREE.Group(); head.position.copy(headPos); head.lookAt(aim); add(head);   // +z of the head points at the desk
    // fabric hood (black outside, silver inside), a white diffuser with a stitched black border
    const hoodGeo = new THREE.CylinderGeometry(0.1, 0.52, 0.42, 4, 1, true);
    const hood = shadow(new THREE.Mesh(hoodGeo, mat('#0e0f12', { roughness: 0.85, side: THREE.FrontSide })));
    hood.rotation.set(-Math.PI / 2, Math.PI / 4, 0); hood.position.z = -0.02; head.add(hood);
    const lining = new THREE.Mesh(hoodGeo, mat('#c9ccd2', { roughness: 0.35, metalness: 0.6, side: THREE.BackSide }));
    lining.rotation.copy(hood.rotation); lining.position.copy(hood.position); lining.scale.setScalar(0.995); head.add(lining);
    head.add(at(new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), glow(2.0, 1.82, 1.55)), 0, 0, 0.195));
    for (const [w, h, x, y] of [[0.76, 0.035, 0, 0.36], [0.76, 0.035, 0, -0.36], [0.035, 0.76, 0.36, 0], [0.035, 0.76, -0.36, 0]]) head.add(at(box(w, h, 0.02, blk), x, y, 0.19));
    for (const [x, y] of [[-0.35, 0.35], [0.35, 0.35], [-0.35, -0.35], [0.35, -0.35]]) head.add(at(ball(0.014, alu, 8), x, y, 0.2));       // rod-end pockets
    // speed ring, lamp body with cooling fins, power switch
    head.add(at(rbox(0.2, 0.2, 0.03, alu, 0.01), 0, 0, -0.235));
    head.add(rot(at(cyl(0.062, 0.062, 0.16, blk, 20), 0, 0, -0.33), Math.PI / 2, 0, 0));
    for (let i = 0; i < 6; i++) head.add(rot(at(cyl(0.072, 0.072, 0.008, blk, 20), 0, 0, -0.27 - i * 0.022), Math.PI / 2, 0, 0));
    head.add(at(rbox(0.05, 0.03, 0.04, blk, 0.006), 0, 0.075, -0.35));
    head.add(at(box(0.012, 0.012, 0.004, glow(0.4, 2.6, 1.2)), 0.012, 0.091, -0.345));
    // power cable: from the lamp body down the pole, along the floor to the wall socket
    head.updateMatrixWorld(true);
    const tail = new THREE.Vector3(0, -0.04, -0.42).applyMatrix4(head.matrixWorld);
    add(tube([P(tail), [base.x + 0.05, 2.75, base.z + 0.02], [base.x + 0.024, 2.2, base.z + 0.02], [base.x + 0.026, 1.0, base.z + 0.022], [base.x + 0.03, 0.35, base.z + 0.02],
      [base.x + 0.18, 0.012, base.z - 0.05], [socket[0] - 0.1, 0.012, 0.12], [socket[0], socket[1] - 0.06, 0.03]], 0.006, mat('#0c0d10', { roughness: 0.6 }), 60));
    const soft = new THREE.RectAreaLight('#ffe9d2', 5.5, 0.9, 0.9);
    soft.position.copy(headPos).add(aim.clone().sub(headPos).normalize().multiplyScalar(0.25)); soft.lookAt(aim); add(soft);
    const key = new THREE.SpotLight('#ffe6cc', 70, 15, 0.72, 0.85, 1.5);
    key.position.set(PX + 3.1, 3.3, 3.4); key.target.position.copy(aim);    // further forward than the lamp, for nicer shadows
    key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0005; key.shadow.radius = 7; key.shadow.camera.near = 0.6; key.shadow.camera.far = 14;
    add(key); add(key.target);
    out.key = key; out.soft = soft;
  }

  // ---- floor lamp with a glowing globe (right corner) -------------------------------------------------------------------
  {
    const x = WALL_RIGHT - 0.75, z = 0.75;
    const brassy = metal('#b08a52', 0.3), dark = mat('#17181c', { roughness: 0.4, metalness: 0.5 });
    add(at(cyl(0.17, 0.185, 0.03, dark, 36), x, 0.015, z));                         // weighted base
    add(rot(at(torus(0.17, 0.006, brassy, 36), x, 0.03, z), Math.PI / 2, 0, 0));      // brass trim ring
    add(at(cyl(0.035, 0.05, 0.05, brassy, 16), x, 0.055, z));
    add(rod([x, 0.06, z], [x, 0.85, z], 0.012, brassy));
    add(at(cyl(0.018, 0.018, 0.04, brassy, 14), x, 0.85, z));                        // joint between the two stem sections
    add(rod([x, 0.85, z], [x, 1.6, z], 0.011, brassy));
    add(at(cyl(0.06, 0.045, 0.035, brassy, 20), x, 1.615, z));                       // globe holder ("gallery")
    add(rot(at(torus(0.05, 0.005, brassy, 20), x, 1.635, z), Math.PI / 2, 0, 0));
    add(at(new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 22), glow(2.3, 1.75, 1.15)), x, 1.82, z));
    add(at(cyl(0.012, 0.016, 0.02, brassy, 12), x, 2.02, z));                        // finial on top
    // cord from the base, through a foot switch, to the wall socket
    add(tube([[x + 0.02, 0.03, z - 0.17], [x + 0.06, 0.012, z - 0.35], [x + 0.12, 0.012, z - 0.5], [socket[0] + 0.05, 0.012, 0.1], [socket[0] + 0.03, socket[1] - 0.06, 0.03]], 0.0045, mat('#e9e4da', { roughness: 0.6 }), 40));
    add(rot(at(rbox(0.07, 0.025, 0.04, mat('#e9e4da', { roughness: 0.5 }), 0.008), x + 0.08, 0.0125, z - 0.42), 0, 0.5, 0));
    // the wall socket both lamps plug into
    add(at(rbox(0.13, 0.09, 0.012, mat('#ece7de', { roughness: 0.45 }), 0.008), socket[0], socket[1], 0.006));
    for (const dx of [-0.03, 0.03]) add(at(rbox(0.032, 0.04, 0.03, dx < 0 ? dark : mat('#e9e4da', { roughness: 0.5 }), 0.006), socket[0] + dx, socket[1], 0.025));
    const p = new THREE.PointLight('#ffc58a', 6.5, 7.5, 1.7); p.position.set(x - 0.05, 1.82, z + 0.1); add(p);
  }

  // ---- plants ------------------------------------------------------------------------------------------------------------
  const greens = ['#3f8a55', '#357a4b', '#4a9960', '#2f6d44'].map((c) => mat(c, { roughness: 0.6, side: THREE.DoubleSide, envMapIntensity: 0.5 }));
  const pot = (x, z, r, h, colour) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); add(g);
    g.add(at(cyl(r, r * 0.8, h, mat(colour, { roughness: 0.55 }), 28), 0, h / 2, 0));
    g.add(rot(at(torus(r, r * 0.07, mat(colour, { roughness: 0.55 }), 28), 0, h, 0), Math.PI / 2, 0, 0));
    g.add(at(cyl(r * 0.93, r * 0.93, 0.01, mat('#2a1d14', { roughness: 1 }), 20), 0, h - 0.015, 0));
    g.add(at(cyl(r * 1.02, r * 0.95, 0.02, mat(colour, { roughness: 0.5 }), 28), 0, 0.01, 0));       // saucer
    const pebble = mat('#b9b2a6', { roughness: 0.9 });
    for (let i = 0; i < 7; i++) { const a = i * 2.3, d = r * (0.35 + 0.45 * ((i * 37) % 10) / 10); const p = ball(r * 0.06, pebble, 8); p.scale.y = 0.6; g.add(at(p, Math.cos(a) * d, h - 0.008, Math.sin(a) * d)); }
    return g;
  };
  const sway = [];
  // a tall fiddle-leaf fig beside the window
  {
    const g = pot(WIN.x - 0.45, 1.6, 0.23, 0.4, '#cfc8bb');
    const trunkPts = [[0, 0.38, 0], [0.04, 0.9, 0.02], [-0.03, 1.4, -0.02], [0.03, 1.95, 0.02]];
    g.add(tube(trunkPts, 0.022, mat('#5b4634', { roughness: 0.9 }), 20));
    const curve = new THREE.CatmullRomCurve3(trunkPts.map((p) => new THREE.Vector3(...p)));
    for (let i = 0; i < 19; i++) {
      const u = 0.3 + (i / 18) * 0.7, p = curve.getPoint(u);
      const holder = new THREE.Group(); holder.position.copy(p); holder.rotation.y = i * 2.4; g.add(holder);
      const size = 0.3 + rnd() * 0.14;
      const l = leaf(size, size * 0.62, greens[i % 4], 0.28); l.rotation.x = 0.75 + rnd() * 0.5 - u * 0.35; l.position.z = 0.02;
      holder.add(l); sway.push({ o: l, base: l.rotation.x, k: 0.035, ph: i });
    }
    const topL = leaf(0.32, 0.2, greens[2], 0.15); topL.position.set(0.03, 1.95, 0.02); topL.rotation.x = 0.15; g.add(topL);
  }
  // a snake plant between the desk and the cabinet
  {
    const g = pot(PX + DESK_W / 2 + 0.45, 0.5, 0.17, 0.34, '#d8cfc0');
    const blade = mat('#3c7a50', { roughness: 0.55, side: THREE.DoubleSide });
    const edge = mat('#8fae5a', { roughness: 0.55, side: THREE.DoubleSide });
    for (let i = 0; i < 11; i++) {
      const holder = new THREE.Group(); holder.position.set(Math.cos(i * 2.4) * 0.06, 0.32, Math.sin(i * 2.4) * 0.06); holder.rotation.y = i * 2.4; g.add(holder);
      const len = 0.55 + rnd() * 0.5;
      const l = leaf(len, 0.09, i % 4 === 0 ? edge : blade, 0.04); l.rotation.x = 0.1 + rnd() * 0.22; holder.add(l);
      sway.push({ o: l, base: l.rotation.x, k: 0.012, ph: i * 1.7 });
    }
  }
  // a pothos trailing from the top of the electrical cabinet (the cabinet itself is built in props.js)
  {
    const cx = LAYOUT.CABINET_X, cy = 2.44, cz = 0.2;
    add(at(cyl(0.11, 0.09, 0.14, mat('#c96f4a', { roughness: 0.8 }), 24), cx + 0.26, cy + 0.07, cz));
    const vineMat = mat('#3d7046', { roughness: 0.8 });
    const vines = [[0.2, 0.8, 0.16], [0.3, 1.15, 0.08], [0.02, 0.45, 0.17], [-0.16, 0.3, 0.18]];
    vines.forEach(([dx, drop, dz], vi) => {
      const pts = [[cx + 0.26, cy + 0.13, cz], [cx + 0.26 + dx * 0.5, cy + 0.19, cz + dz * 0.6], [cx + 0.26 + dx, cy + 0.02, cz + dz], [cx + 0.26 + dx * 1.05, cy - drop * 0.5, cz + dz + 0.02], [cx + 0.26 + dx * 1.0, cy - drop, cz + dz]];
      add(tube(pts, 0.006, vineMat, 26));
      const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
      const n = Math.round(6 + drop * 12);
      for (let i = 0; i < n; i++) {
        const p = curve.getPoint(0.12 + (i / n) * 0.88);
        const holder = new THREE.Group(); holder.position.copy(p); holder.rotation.y = i * 2.1 + vi; add(holder);
        const l = leaf(0.085 + rnd() * 0.035, 0.07, greens[(i + vi) % 4], 0.3); l.rotation.x = 1.5 + rnd() * 0.7; holder.add(l);
        sway.push({ o: l, base: l.rotation.x, k: 0.05, ph: i + vi * 3 });
      }
    });
  }
  // a small succulent at the back of the desk
  {
    const g = new THREE.Group(); g.position.set(PX + DESK_W / 2 - 0.2, DESK_Y, 0.4); add(g);
    g.add(at(cyl(0.055, 0.045, 0.07, mat('#ece7de', { roughness: 0.45 }), 20), 0, 0.035, 0));
    for (let i = 0; i < 9; i++) {
      const holder = new THREE.Group(); holder.position.y = 0.065; holder.rotation.y = i * 2.4; g.add(holder);
      const l = leaf(0.07 + (i % 3) * 0.012, 0.035, greens[i % 4], 0.1); l.rotation.x = 0.35 + (i % 3) * 0.3; holder.add(l);
    }
  }
  out.ticks.push((t) => { for (const s of sway) s.o.rotation.x = s.base + Math.sin(t * 0.9 + s.ph) * s.k; });

  // ---- wall clock that shows the real time -------------------------------------------------------------------------------
  {
    const g = new THREE.Group(); g.position.set(LAYOUT.PLAQUE_X, 3.12, 0.0); add(g);
    const rim = cyl(0.23, 0.23, 0.04, mat('#17191f', { roughness: 0.4, metalness: 0.4 }), 40); rim.rotation.x = Math.PI / 2; rim.position.z = 0.02; g.add(rim);
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.21, 40), mat('#ffffff', { map: clockFace(), roughness: 0.8 })); face.position.z = 0.041; g.add(face);
    const hand = (len, w, colour) => { const h = new THREE.Group(); h.position.z = 0.046; h.add(at(new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.004), mat(colour)), 0, len / 2 - 0.02, 0)); g.add(h); return h; };
    const hr = hand(0.12, 0.014, '#17191f'), mn = hand(0.17, 0.01, '#17191f'), sc = hand(0.18, 0.004, '#d8402f');
    const gl = new THREE.Mesh(new THREE.CircleGeometry(0.21, 40), glass(0.14)); gl.position.z = 0.056; g.add(gl);
    let last = -1;
    out.ticks.push(() => {
      const d = new Date(), s = d.getSeconds();
      if (s === last) return; last = s;
      const m = d.getMinutes() + s / 60, h = (d.getHours() % 12) + m / 60;
      hr.rotation.z = -(h / 12) * Math.PI * 2; mn.rotation.z = -(m / 60) * Math.PI * 2; sc.rotation.z = -(s / 60) * Math.PI * 2;
    });
  }

  // ---- dust floating in the light from the window ----------------------------------------------------------------------------
  {
    const N = 150, pos = new Float32Array(N * 3), speed = new Float32Array(N);
    for (let i = 0; i < N; i++) { pos[i * 3] = WIN.x - 0.9 + rnd() * 4.2; pos[i * 3 + 1] = 0.2 + rnd() * 3; pos[i * 3 + 2] = 0.3 + rnd() * 4.6; speed[i] = 0.02 + rnd() * 0.04; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const dustMat = new THREE.PointsMaterial({ color: '#ffe6c4', size: 0.022, transparent: true, opacity: 0.5, depthWrite: false, sizeAttenuation: true });
    add(new THREE.Points(geo, dustMat));
    out.dustMat = dustMat;
    out.ticks.push((t, dt) => {
      for (let i = 0; i < N; i++) {
        pos[i * 3 + 1] += speed[i] * dt; pos[i * 3] += Math.sin(t * 0.3 + i) * 0.0009;
        if (pos[i * 3 + 1] > 3.3) pos[i * 3 + 1] = 0.2;
      }
      geo.attributes.position.needsUpdate = true;
    });
  }

  // ---- evening light: purple sky light through the window, and light bouncing around the room -------------------------------
  //      A real room is lit as much by light bouncing off its floor and walls as by the lamps themselves.
  //      The soft "area" lights below fake that bounce: they glow up from the floor and out from the wood panel.
  {
    // sky light through the window: lavender and soft, with the window frame's shadow faintly on the floor
    windowGlow.color.set(EVENING.window); windowGlow.intensity = 3.4;
    sun.color.set('#c6a6e6'); sun.intensity = 60; sun.penumbra = 0.85; sun.angle = 0.42;
    const dir = new THREE.Vector3(0.62, -0.62, 1).normalize(), wc = new THREE.Vector3(WIN.x, WIN.y, -0.1);
    sun.position.copy(wc).addScaledVector(dir, -9); sun.target.position.copy(wc).addScaledVector(dir, 5);
    // whole-room fill: violet from above (the sky), warm wood colour from below (the floor)
    hemi.color.set('#9884d4'); hemi.groundColor.set('#7a5034'); hemi.intensity = 0.55;
    // bounce 1: the purple window light pooling on the floor and lifting the curtains, the plant and the wheel
    const winBounce = new THREE.RectAreaLight(EVENING.bounce, 1.0, 2.4, 2.0);
    winBounce.position.set(WIN.x + 0.4, 0.02, 1.3); winBounce.lookAt(WIN.x + 0.4, 3, 1.31); add(winBounce);
    // bounce 2: the warm lamplight bouncing off the wooden floor onto the desk, chair and the lower walls
    const floorBounce = new THREE.RectAreaLight('#f0a46e', 1.1, 4.4, 2.6);
    floorBounce.position.set(PX + 0.8, 0.02, 1.7); floorBounce.lookAt(PX + 0.8, 3, 1.71); add(floorBounce);
    // bounce 3: the shelf LEDs wash the slatted wood, which glows warm light back into the room
    const panelBounce = new THREE.RectAreaLight('#ff9d5c', 0.7, 3.6, 2.4);
    panelBounce.position.set(PX, 1.9, 0.13); panelBounce.lookAt(PX, 1.9, 4); add(panelBounce);
    out.dustMat.color.set('#ecd8ff'); out.dustMat.opacity = 0.38;
  }

  return out;
}
