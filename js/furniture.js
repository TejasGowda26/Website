// furniture.js — everything in the room that is NOT a clickable project:
// walls with the window opening, curtains, floor and rug, the wood panel and
// shelves, the standing desk, the chair, the lamps (and the light they give),
// the plants, and small touches like the wall clock and floating dust.

import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
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

  // ---- light from outside: a soft glow from the whole window, plus a beam that
  //      throws the window's shape (and its frame's shadow) across the floor ----------------------------
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
  const slats = new THREE.InstancedMesh(new THREE.BoxGeometry(pitch * 0.62, panelH, 0.05), mat('#ffffff', { roughness: 0.5, envMapIntensity: 0.7 }), nSlats);
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
      g.add(at(ball(0.035, mat('#0c0d10', { roughness: 0.6 }), 12), Math.cos(a) * 0.31, 0.035, Math.sin(a) * 0.31));
    }
    g.add(at(cyl(0.045, 0.05, 0.12, blk, 16), 0, 0.14, 0));
    g.add(at(cyl(0.026, 0.026, 0.26, metal('#c2c6cd', 0.25), 16), 0, 0.31, 0));
    g.add(at(rbox(0.24, 0.05, 0.24, blk, 0.012), 0, 0.445, 0));
    g.add(at(rbox(0.52, 0.1, 0.5, fabric, 0.045), 0, 0.52, 0));                    // seat
    const back = new THREE.Group(); back.position.set(0, 0.56, 0.25); back.rotation.x = 0.13; g.add(back);
    back.add(at(rbox(0.07, 0.36, 0.035, blk, 0.012), 0, 0.14, 0.04));                // spine
    back.add(at(rbox(0.48, 0.5, 0.075, fabric, 0.045), 0, 0.42, 0));                 // backrest
    back.add(at(rbox(0.36, 0.1, 0.085, fabric, 0.04), 0, 0.22, -0.01));              // lumbar pad
    for (const sx of [-1, 1]) {
      g.add(at(rbox(0.035, 0.2, 0.04, blk, 0.01), sx * 0.3, 0.63, 0.04));
      g.add(at(rbox(0.07, 0.03, 0.27, mat('#1e2026', { roughness: 0.7 }), 0.012), sx * 0.3, 0.74, 0.0));
    }
  }

  // ---- studio softbox on a stand: the main ("key") light of the room ------------------------------------------------
  {
    const base = [WALL_RIGHT - 0.98, 0, 0.42], headPos = new THREE.Vector3(base[0] - 0.12, 3.0, base[2] + 0.36);
    const aim = new THREE.Vector3(PX - 0.1, 1.05, 0.7);
    const blk = mat('#121317', { roughness: 0.5, metalness: 0.4 });
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + 0.5; add(rod([base[0], 0.62, base[2]], [base[0] + Math.cos(a) * 0.5, 0.02, base[2] + Math.sin(a) * 0.5], 0.012, blk)); }
    add(rod([base[0], 0.3, base[2]], [base[0], 2.92, base[2]], 0.014, blk));
    add(rod([base[0], 2.92, base[2]], [headPos.x, headPos.y, headPos.z - 0.2], 0.014, blk));
    add(at(cyl(0.022, 0.022, 0.06, blk, 12), base[0], 1.5, base[2]));
    const head = new THREE.Group(); head.position.copy(headPos); head.lookAt(aim); add(head);       // +z of the head points at the desk
    const hood = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.52, 0.42, 4, 1, true), mat('#0e0f12', { roughness: 0.7, side: THREE.DoubleSide })));
    hood.rotation.set(-Math.PI / 2, Math.PI / 4, 0); hood.position.z = -0.02; head.add(hood);
    head.add(at(new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.72), glow(2.0, 1.82, 1.55)), 0, 0, 0.19));
    head.add(at(box(0.76, 0.76, 0.012, blk), 0, 0, 0.18));
    head.add(at(cyl(0.05, 0.05, 0.18, blk, 12), 0, 0, -0.3).rotateX(Math.PI / 2));
    const soft = new THREE.RectAreaLight('#ffe9d2', 5.5, 0.9, 0.9);
    soft.position.copy(headPos).add(aim.clone().sub(headPos).normalize().multiplyScalar(0.25)); soft.lookAt(aim); add(soft);
    const key = new THREE.SpotLight('#ffe6cc', 70, 15, 0.72, 0.85, 1.5);
    key.position.set(PX + 3.1, 3.3, 3.4); key.target.position.copy(aim);    // further forward than the lamp, for nicer shadows
    key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0005; key.shadow.radius = 7; key.shadow.camera.near = 0.6; key.shadow.camera.far = 14;
    add(key); add(key.target);
  }

  // ---- floor lamp with a glowing globe (right corner) -------------------------------------------------------------------
  {
    const x = WALL_RIGHT - 0.75, z = 0.75;
    const brassy = metal('#b08a52', 0.3);
    add(at(cyl(0.17, 0.18, 0.025, brassy, 28), x, 0.0125, z));
    add(rod([x, 0.02, z], [x, 1.62, z], 0.012, brassy));
    add(at(new THREE.Mesh(new THREE.SphereGeometry(0.2, 28, 20), glow(2.3, 1.75, 1.15)), x, 1.82, z));
    add(at(cyl(0.05, 0.06, 0.05, brassy, 16), x, 1.63, z));
    const p = new THREE.PointLight('#ffc58a', 6.5, 7.5, 1.7); p.position.set(x - 0.05, 1.82, z + 0.1); add(p);
  }

  // ---- plants ------------------------------------------------------------------------------------------------------------
  const greens = ['#3f8a55', '#357a4b', '#4a9960', '#2f6d44'].map((c) => mat(c, { roughness: 0.6, side: THREE.DoubleSide, envMapIntensity: 0.5 }));
  const pot = (x, z, r, h, colour) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); add(g);
    g.add(at(cyl(r, r * 0.8, h, mat(colour, { roughness: 0.55 }), 28), 0, h / 2, 0));
    g.add(rot(at(torus(r, r * 0.07, mat(colour, { roughness: 0.55 }), 28), 0, h, 0), Math.PI / 2, 0, 0));
    g.add(at(cyl(r * 0.93, r * 0.93, 0.01, mat('#2a1d14', { roughness: 1 }), 20), 0, h - 0.015, 0));
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

  // ---- the lights that change with the time of day -------------------------------------------------------------------------------
  const moon = new THREE.Color('#8fa6ff'), dusk = new THREE.Color('#ff9a57'), noon = new THREE.Color('#fff3df'), c = new THREE.Color();
  out.setTime = (s, hour) => {
    const d = s.daylight;
    if (d < 0.45) c.copy(moon).lerp(dusk, d / 0.45); else c.copy(dusk).lerp(noon, (d - 0.45) / 0.55);
    sun.color.copy(c);
    sun.intensity = d < 0.08 ? 70 : 170 + 190 * d;
    const dir = new THREE.Vector3(0.72 + 0.12 * Math.sin(hour * 0.5), -(0.78 + 0.3 * d), 1).normalize();
    const wc = new THREE.Vector3(WIN.x, WIN.y, -0.1);
    sun.position.copy(wc).addScaledVector(dir, -9); sun.target.position.copy(wc).addScaledVector(dir, 5);
    windowGlow.color.setRGB(s.low[0] / 255, s.low[1] / 255, s.low[2] / 255, THREE.SRGBColorSpace).lerp(noon, 0.25 + 0.4 * d);
    windowGlow.intensity = 1.6 + 4.5 * d;
    hemi.color.setRGB(s.mid[0] / 255, s.mid[1] / 255, s.mid[2] / 255, THREE.SRGBColorSpace).lerp(noon, 0.55);
    hemi.intensity = 0.42 + 0.38 * d;
    out.dustMat.opacity = 0.28 + 0.4 * d;
  };

  return out;
}
