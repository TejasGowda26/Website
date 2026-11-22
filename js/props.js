// props.js — the clickable objects: one for each project, job or section of
// the resume. Each block below builds one object out of simple shapes, then
// calls register(...) so it can be hovered and clicked.
//
// To swap an object for a Blender model later: load the .glb, add it to the
// group `g` in that block instead of the shapes, and keep the register line.

import * as THREE from 'three';
import { ACCENT, FONT, LAYOUT, mat, metal, glow, glass, shadow, box, rbox, cyl, ball, torus, at, rot, tube, leaf, makeCanvas, canvasTexture, screen, seededRandom } from './kit.js';

const { PX, DESK_Y, WIN, SHELF_TOP, SHELF_LOW } = LAYOUT;

// ---- pictures drawn with code (used on screens, the plaque and the photo) -------------

// A book spine: the cover colour, a band near the top, the title running bottom to top.
function drawSpine(c, title, colour) {
  const g = c.getContext('2d');
  g.fillStyle = colour; g.fillRect(0, 0, 64, 384);
  const light = ['#e3ddd0', '#5ee0c8'].includes(colour);
  const ink = light ? '#1d2027' : '#f4f1ea';
  g.fillStyle = ink; g.globalAlpha = 0.85; g.fillRect(8, 26, 48, 5); g.fillRect(8, 36, 48, 2); g.fillRect(8, 342, 48, 2); g.globalAlpha = 1;
  g.save(); g.translate(34, 322); g.rotate(-Math.PI / 2);
  g.font = `600 25px ${FONT}`; g.fillStyle = ink; g.textBaseline = 'middle';
  let size = 25; while (g.measureText(title).width > 270 && size > 14) { size--; g.font = `600 ${size}px ${FONT}`; }
  g.fillText(title, 0, 0); g.restore();
}
function drawPipeline(c, progress) {
  const g = c.getContext('2d'), W = c.width, H = c.height;
  g.fillStyle = '#10141b'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#1b212b'; g.fillRect(0, 0, W, 44);
  g.fillStyle = '#9aa0ad'; g.font = `600 20px ${FONT}`; g.textBaseline = 'middle'; g.textAlign = 'left';
  g.fillText('ACS · CI/CD pipeline', 18, 23);
  const stages = ['Build', 'Test', 'Deploy'];
  stages.forEach((name, i) => {
    const cx = 96 + i * 160, cy = 150;
    const done = progress >= i + 1, running = !done && progress > i;
    if (i < 2) { g.strokeStyle = progress >= i + 1 ? ACCENT : '#3d424d'; g.lineWidth = 6; g.beginPath(); g.moveTo(cx + 40, cy); g.lineTo(cx + 120, cy); g.stroke(); }
    g.lineWidth = 6;
    g.strokeStyle = done ? ACCENT : running ? '#ffb765' : '#3d424d';
    g.fillStyle = done ? ACCENT : '#10141b';
    g.beginPath(); g.arc(cx, cy, 34, 0, Math.PI * 2); g.fill(); g.stroke();
    if (done) {
      g.strokeStyle = '#0c1a17'; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(cx - 14, cy + 1); g.lineTo(cx - 4, cy + 12); g.lineTo(cx + 15, cy - 11); g.stroke();
    } else if (running) {
      const a = (progress - i) * Math.PI * 4;
      g.strokeStyle = '#ffb765'; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, 18, a, a + 2.2); g.stroke();
    }
    g.fillStyle = done ? '#f2f4f8' : '#9aa0ad'; g.font = `600 22px ${FONT}`; g.textAlign = 'center';
    g.fillText(name, cx, cy + 66);
  });
  g.textAlign = 'left'; g.font = `500 18px ui-monospace, Menlo, monospace`;
  g.fillStyle = progress >= 3 ? ACCENT : '#6d727d';
  g.fillText(progress >= 3 ? '$ pipeline passed' : progress > 0 ? '$ running…' : '$ waiting for a push', 18, H - 30);
}

function drawScope(c, p) {
  // p goes 0 → 1 as the trace draws itself across the screen
  const g = c.getContext('2d'), W = c.width, H = c.height;
  g.fillStyle = '#07110e'; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(94,224,200,0.16)'; g.lineWidth = 1;
  for (let x = 0; x <= W; x += W / 8) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  for (let y = 0; y <= H; y += H / 6) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  const ref = H * 0.3, base = H * 0.82;
  const curve = (overshoot, dip, slow) => (u) => {
    if (u < 0.12) return base;
    const tt = (u - 0.12) / 0.88;
    let y = 1 - Math.exp(-tt * slow) * (1 + overshoot * Math.sin(tt * 14));
    const d = tt - 0.55;                         // the load disturbance hits here
    if (d > 0) y -= dip * Math.exp(-d * 9) * Math.sin(Math.min(1, d * 12) * Math.PI * 0.5);
    return base + (ref - base) * y;
  };
  const plot = (fn, colour, dashed) => {
    g.strokeStyle = colour; g.lineWidth = 3; g.setLineDash(dashed ? [6, 5] : []);
    g.beginPath();
    for (let i = 0; i <= 120 * p; i++) { const u = i / 120; const x = u * W, y = fn(u); i ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke(); g.setLineDash([]);
  };
  plot(curve(0.25, 0.42, 5), '#c98a3a', true);    // PID: more overshoot, bigger dip
  plot(curve(0.04, 0.14, 9), ACCENT, false);      // NN-MPC: settles faster, smaller dip
  g.font = `600 13px ${FONT}`; g.textBaseline = 'top';
  g.fillStyle = ACCENT; g.fillText('NN-MPC', 8, 6);
  g.fillStyle = '#c98a3a'; g.fillText('PID', 78, 6);
}

function drawPlaque(c) {
  const g = c.getContext('2d'), W = c.width, H = c.height;
  g.fillStyle = '#cfc8b8'; g.fillRect(0, 0, W, H);
  g.strokeStyle = '#9a7f45'; g.lineWidth = 6; g.strokeRect(14, 14, W - 28, H - 28);
  g.fillStyle = '#2a2520'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `700 34px ${FONT}`; g.fillText('B.Tech', W / 2, H * 0.27);
  g.font = `600 19px ${FONT}`; g.fillText('Electrical and', W / 2, H * 0.42); g.fillText('Electronics Engineering', W / 2, H * 0.5);
  g.fillStyle = '#6b6254'; g.font = `500 16px ${FONT}`;
  g.fillText('CHRIST (Deemed to be', W / 2, H * 0.66); g.fillText('University), Bengaluru', W / 2, H * 0.73);
  g.fillStyle = '#b79a5a'; g.font = `700 22px ${FONT}`; g.fillText('2027', W / 2, H * 0.87);
}

function drawPortrait(c) {
  const g = c.getContext('2d'), W = c.width, H = c.height;
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#2b2f5a'); bg.addColorStop(1, '#a8667d');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.fillStyle = '#14161c';
  g.beginPath(); g.arc(W / 2, H * 0.42, W * 0.2, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(W / 2, H * 1.02, W * 0.4, H * 0.34, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#f2f4f8'; g.font = `700 30px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('TVG', W / 2, H * 0.86);
}

function drawResumePage(c) {
  const g = c.getContext('2d'), W = c.width, H = c.height;
  g.fillStyle = '#f4f1ea'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#1d2029'; g.fillRect(40, 34, W - 80, 16);
  g.fillStyle = '#0f6e56'; g.fillRect(70, 62, W - 140, 7);
  let y = 96;
  for (let s = 0; s < 5; s++) {
    g.fillStyle = '#0f6e56'; g.fillRect(22, y, 80, 6); y += 14;
    for (let l = 0; l < 4; l++) { g.fillStyle = '#9a968c'; g.fillRect(22, y, W - 44 - ((s * 37 + l * 53) % 70), 4); y += 10; }
    y += 8;
  }
}


// =============================================================================
export function buildProps(scene, { demoCanvas, photoUrl }) {
  const room = { hits: [], items: {}, refreshers: [] };
  const rnd = seededRandom(17);

  // Registers a clickable object: remembers where it is and gives it an invisible "hit box".
  function register(id, group, { tick, anchor, view, pad = 0.06 } = {}) {
    scene.add(group);
    group.updateWorldMatrix(true, true);
    const b = new THREE.Box3().setFromObject(group);
    const size = b.getSize(new THREE.Vector3()), center = b.getCenter(new THREE.Vector3());
    const hit = new THREE.Mesh(new THREE.BoxGeometry(size.x + pad * 2, size.y + pad * 2, size.z + pad * 2), new THREE.MeshBasicMaterial());
    hit.position.copy(center); hit.visible = false; hit.userData.id = id;
    scene.add(hit); room.hits.push(hit);
    room.items[id] = {
      id, group, center, radius: size.length() / 2,
      anchor: anchor ? new THREE.Vector3(...anchor) : new THREE.Vector3(center.x, b.max.y + 0.12, center.z),
      view, hover: 0, tick,
    };
  }

  const topY = SHELF_TOP + 0.025, lowY = SHELF_LOW + 0.025;     // the surfaces things stand on
  const dark = mat('#0b0c10', { roughness: 0.3, metalness: 0.4 });
  const steel = metal('#aeb3bd', 0.3), alu = metal('#9aa0ab', 0.35), copper = metal('#b9792f', 0.35);
  const black = mat('#101116', { roughness: 0.45 });

  // ---- Traffic Jam Assist: ultrawide monitor + force-feedback steering wheel -------------------------
  {
    const g = new THREE.Group();
    const MY = DESK_Y + 0.5;                          // height of the middle of the screen
    // soft coloured glow on the wall behind the monitor
    const gc = makeCanvas(256, 128), gx = gc.getContext('2d');
    const gr = gx.createRadialGradient(128, 64, 4, 128, 64, 128); gr.addColorStop(0, 'rgba(94,224,200,0.9)'); gr.addColorStop(0.5, 'rgba(110,120,255,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    gx.fillStyle = gr; gx.fillRect(0, 0, 256, 128);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 1.5), new THREE.MeshBasicMaterial({ map: canvasTexture(gc), transparent: true, opacity: 0.34, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    halo.position.set(PX, MY, 0.098); scene.add(halo);

    g.add(at(rbox(1.75, 0.58, 0.035, dark, 0.014), PX, MY, 0.42));
    g.add(at(rbox(0.95, 0.32, 0.05, dark, 0.02), PX, MY, 0.385));
    const demoTex = canvasTexture(demoCanvas);
    const scr = screen(1.7, 0.53, demoTex); scr.position.set(PX, MY, 0.4385); g.add(scr);
    const sheen = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.53), glass(0.06)); sheen.position.set(PX, MY, 0.4395); g.add(sheen);
    g.add(at(box(0.012, 0.004, 0.002, glow(0.4, 2.2, 1.9)), PX + 0.8, MY - 0.278, 0.438));          // power light
    g.add(at(rbox(0.075, 0.3, 0.03, metal('#2a2d36', 0.35), 0.01), PX, DESK_Y + 0.16, 0.37));       // stand neck
    for (const s of [-1, 1]) g.add(rot(at(rbox(0.36, 0.018, 0.05, metal('#2a2d36', 0.35), 0.008), PX + s * 0.15, DESK_Y + 0.009, 0.45), 0, s * 0.45, 0));
    // webcam on top
    g.add(at(rbox(0.11, 0.036, 0.04, dark, 0.012), PX, MY + 0.308, 0.425));
    g.add(rot(at(cyl(0.012, 0.012, 0.01, metal('#30343d', 0.2), 16), PX, MY + 0.308, 0.447), Math.PI / 2, 0, 0));
    g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.003, 6, 6), glow(0.4, 2.4, 0.8)), PX + 0.035, MY + 0.308, 0.446));

    // wheel base clamped to the front edge of the desk
    const baseM = mat('#15171c', { roughness: 0.4, metalness: 0.2 });
    g.add(at(rbox(0.3, 0.16, 0.3, baseM, 0.03), PX, DESK_Y + 0.08, 1.03));
    for (let i = 0; i < 4; i++) g.add(at(box(0.2, 0.004, 0.012, black), PX, DESK_Y + 0.161, 0.94 + i * 0.03));   // cooling slots
    g.add(at(box(0.02, 0.01, 0.012, glow(0.6, 2.6, 2.2)), PX + 0.11, DESK_Y + 0.162, 1.13));
    g.add(at(rbox(0.22, 0.07, 0.07, baseM, 0.012), PX, DESK_Y - 0.075, 1.17));                       // clamp under the desk edge
    const column = new THREE.Group(); column.position.set(PX, DESK_Y + 0.1, 1.17); column.rotation.x = -0.28; g.add(column);
    column.add(rot(at(cyl(0.03, 0.03, 0.1, dark, 16), 0, 0, 0.05), Math.PI / 2, 0, 0));
    column.add(rot(at(cyl(0.046, 0.046, 0.03, alu, 20), 0, 0, 0.095), Math.PI / 2, 0, 0));           // quick release
    const wheel = new THREE.Group(); wheel.position.z = 0.13; column.add(wheel);
    wheel.add(torus(0.155, 0.019, mat('#0d0e12', { roughness: 0.6 })));
    for (const a0 of [-0.55, Math.PI - 0.55]) {                                                       // suede grips left and right
      const grip = shadow(new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.0225, 12, 20, 1.1), mat('#2b2e37', { roughness: 0.95 }))); grip.rotation.z = a0; wheel.add(grip);
    }
    for (const a of [Math.PI, 0, -Math.PI / 2]) wheel.add(rot(at(rbox(0.13, 0.03, 0.008, alu, 0.003), Math.cos(a) * 0.085, Math.sin(a) * 0.085, 0), 0, 0, a));
    wheel.add(rot(cyl(0.05, 0.05, 0.03, mat('#1b1d24', { roughness: 0.5 }), 24), Math.PI / 2, 0, 0));
    [[-0.085, 0.035, [2.4, 0.5, 0.4]], [0.085, 0.035, [0.4, 2.3, 1.9]], [-0.085, -0.03, [2.4, 1.6, 0.3]], [0.085, -0.03, [1.8, 1.8, 2.0]]].forEach(([x, y, c]) => wheel.add(rot(at(new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.006, 10), glow(...c.map((v) => v * 0.55))), x, y, 0.008), Math.PI / 2, 0, 0)));
    for (const s of [-1, 1]) wheel.add(at(rbox(0.085, 0.045, 0.005, alu, 0.002), s * 0.115, 0.01, -0.03));     // paddle shifters
    wheel.add(at(box(0.016, 0.03, 0.04, glow(0.5, 2.4, 2.0)), 0, 0.155, 0));                          // the "top dead centre" mark
    room.demoTexture = demoTex; room.wheel = wheel;
    register('tja', g, { anchor: [PX, MY + 0.42, 0.45], view: { pos: [PX + 0.3, 1.5, 3.7], target: [PX, 1.2, 0.5] } });
  }

  // ---- laptop: CI/CD pipeline -----------------------------------------------------------------------------
  {
    const g = new THREE.Group(); g.position.set(PX + 0.98, DESK_Y, 0.84); g.rotation.y = -0.36;
    g.add(at(rbox(0.5, 0.018, 0.34, alu, 0.008), 0, 0.009, 0));
    const kc = makeCanvas(256, 96), kg = kc.getContext('2d'); kg.fillStyle = '#8f949e'; kg.fillRect(0, 0, 256, 96);
    for (let r = 0; r < 5; r++) for (let k = 0; k < 14; k++) { kg.fillStyle = '#1b1d24'; kg.beginPath(); kg.roundRect(5 + k * 17.7, 4 + r * 18, 15, 15, 3); kg.fill(); }
    const keys = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.165), mat('#ffffff', { map: canvasTexture(kc), roughness: 0.6 })); keys.rotation.x = -Math.PI / 2; keys.position.set(0, 0.0185, -0.055); g.add(keys);
    g.add(at(rbox(0.15, 0.002, 0.09, metal('#858a94', 0.3), 0.001), 0, 0.0185, 0.1));                // trackpad
    g.add(rot(at(cyl(0.008, 0.008, 0.4, alu, 10), 0, 0.02, -0.168), 0, 0, Math.PI / 2));             // hinge
    const lid = new THREE.Group(); lid.position.set(0, 0.02, -0.17); lid.rotation.x = -0.26; g.add(lid);
    lid.add(at(rbox(0.5, 0.33, 0.012, alu, 0.006), 0, 0.165, 0));
    lid.add(at(box(0.485, 0.315, 0.002, dark), 0, 0.165, 0.0065));
    const c = makeCanvas(512, 320); const tex = canvasTexture(c);
    const scr = screen(0.465, 0.29, tex); scr.position.set(0, 0.165, 0.008); lid.add(scr);
    let progress = 0, last = -1, rest = 0;
    const redraw = () => { drawPipeline(c, progress); tex.needsUpdate = true; };
    redraw(); room.refreshers.push(redraw);
    register('cbc', g, {
      tick: (t, dt, h) => {
        if (h > 0.5) { progress = Math.min(3, progress + dt * 1.1); rest = 2.5; }
        else if (progress > 0) { rest -= dt; if (rest < 0) progress = 0; }
        const shown = Math.round(progress * 30);
        if (shown !== last) { last = shown; redraw(); }
      },
    });
  }

  // ---- resume on a clipboard, with a steaming mug beside it ---------------------------------------------------
  {
    const g = new THREE.Group(); g.position.set(PX - 0.93, DESK_Y, 0.93); g.rotation.y = 0.2;
    g.add(at(rbox(0.34, 0.01, 0.47, mat('#7a5638', { roughness: 0.6 }), 0.004), 0, 0.005, 0));
    g.add(at(rbox(0.13, 0.02, 0.04, steel, 0.006), 0, 0.02, -0.21));
    const c = makeCanvas(256, 360); drawResumePage(c);
    const page = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.42), mat('#cfcbc1', { map: canvasTexture(c), roughness: 0.9, side: THREE.DoubleSide }));
    const pivot = new THREE.Group(); pivot.position.set(0, 0.012, 0.215); g.add(pivot);
    page.rotation.x = -Math.PI / 2; page.position.z = -0.21; page.receiveShadow = true; page.castShadow = true; pivot.add(page);
    const pen = new THREE.Group(); pen.position.set(0.25, 0.008, 0.03); pen.rotation.y = 0.5; g.add(pen);
    pen.add(rot(cyl(0.006, 0.006, 0.14, mat('#15171c', { roughness: 0.3 }), 10), 0, 0, Math.PI / 2));
    pen.add(rot(at(cyl(0.006, 0.001, 0.02, steel, 10), -0.08, 0, 0), 0, 0, Math.PI / 2));

    // mug (not clickable), with a handle and three wisps of steam
    const mx = PX - 0.56, mz = 0.55, my = DESK_Y;
    scene.add(at(cyl(0.062, 0.062, 0.006, mat('#3b2a20', { roughness: 0.8 }), 20), mx, my + 0.003, mz));
    const ceramic = mat('#ece7de', { roughness: 0.25, envMapIntensity: 1 });
    scene.add(at(cyl(0.046, 0.04, 0.1, ceramic, 24), mx, my + 0.056, mz));
    scene.add(rot(at(shadow(new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 8, 16, Math.PI), ceramic)), mx + 0.045, my + 0.056, mz), 0, 0, -Math.PI / 2));
    scene.add(at(cyl(0.04, 0.04, 0.004, mat('#2b1a10', { roughness: 0.15 }), 20), mx, my + 0.102, mz));
    const sc = makeCanvas(64, 64), sg = sc.getContext('2d'); const sgr = sg.createRadialGradient(32, 32, 0, 32, 32, 30); sgr.addColorStop(0, 'rgba(255,255,255,0.5)'); sgr.addColorStop(1, 'rgba(255,255,255,0)'); sg.fillStyle = sgr; sg.fillRect(0, 0, 64, 64);
    const steamTex = canvasTexture(sc);
    const wisps = [0, 1, 2].map((i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.07), new THREE.MeshBasicMaterial({ map: steamTex, transparent: true, depthWrite: false, opacity: 0.3 })); scene.add(m); return { m, ph: i / 3 }; });
    register('resume', g, {
      pad: 0.05, anchor: [PX - 0.93, DESK_Y + 0.3, 0.93],
      tick: (t, dt, h) => {
        pivot.rotation.x = h * 0.95;
        for (const w of wisps) { const u = (t * 0.22 + w.ph) % 1; w.m.position.set(mx + Math.sin(u * 6 + w.ph * 9) * 0.012, my + 0.11 + u * 0.17, mz); w.m.material.opacity = 0.32 * Math.sin(u * Math.PI); w.m.scale.setScalar(0.7 + u); }
      },
    });
  }

  // ---- top shelf: Marx generator (MATLAB experiments) ------------------------------------------------------------
  {
    const g = new THREE.Group(); g.position.set(PX - 1.42, topY, 0.28);
    g.add(at(rbox(0.42, 0.028, 0.24, mat('#22252d', { roughness: 0.5 }), 0.006), 0.07, 0.014, 0));
    const rodGlass = new THREE.MeshPhysicalMaterial({ color: '#cfe6ff', roughness: 0.1, transparent: true, opacity: 0.45 });
    for (const dz of [-0.07, 0.07]) g.add(at(cyl(0.008, 0.008, 0.44, rodGlass, 10), -0.06, 0.248, dz));     // clear support posts
    const blue = mat('#2c5fb8', { roughness: 0.4 });
    const stageSparks = [];
    for (let i = 0; i < 5; i++) {
      const y = 0.07 + i * 0.08;
      g.add(at(cyl(0.04, 0.04, 0.056, i % 2 ? blue : copper, 20), -0.06, y, 0));                             // capacitor
      g.add(at(cyl(0.041, 0.041, 0.006, steel, 20), -0.06, y + 0.03, 0));
      g.add(rot(at(cyl(0.008, 0.008, 0.075, mat('#c9b48a', { roughness: 0.6 }), 8), 0.0, y + 0.04, 0.045), 0, 0, 0.9));   // charging resistor
      g.add(at(ball(0.011, steel, 10), 0.035, y - 0.006, -0.02)); g.add(at(ball(0.011, steel, 10), 0.035, y + 0.03, -0.02));   // spark gap
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), glow(1.6, 2.4, 3.6)); s.position.set(0.035, y + 0.012, -0.02); s.visible = false; g.add(s); stageSparks.push(s);
    }
    g.add(at(ball(0.05, steel), -0.06, 0.5, 0));
    g.add(at(cyl(0.007, 0.007, 0.38, steel, 10), 0.2, 0.22, 0)); g.add(at(ball(0.03, steel, 16), 0.2, 0.42, 0));
    g.add(at(cyl(0.018, 0.018, 0.012, copper, 12), 0.2, 0.034, 0)); g.add(at(cyl(0.018, 0.018, 0.012, copper, 12), 0.24, 0.034, 0.08));
    const N = 9, pos = new Float32Array(N * 3);
    const sparkGeo = new THREE.BufferGeometry(); sparkGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const spark = new THREE.Line(sparkGeo, new THREE.LineBasicMaterial({ color: new THREE.Color(1.4, 2.0, 3.0), toneMapped: false }));
    spark.visible = false; g.add(spark);
    const arcGlow = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), glow(1.2, 1.8, 2.8)); arcGlow.position.set(0.08, 0.47, 0); arcGlow.visible = false; g.add(arcGlow);
    let next = 0;
    register('matlab', g, {
      tick: (t, dt, h) => {
        const on = h > 0.25 && Math.sin(t * 23) > -0.5;
        spark.visible = on; arcGlow.visible = on;
        stageSparks.forEach((s, i) => { s.visible = h > 0.25 && Math.sin(t * 31 + i * 1.3) > 0.2; });
        if (on && t > next) {
          next = t + 0.045;
          for (let i = 0; i < N; i++) {
            const u = i / (N - 1), jit = i === 0 || i === N - 1 ? 0 : 0.03;
            pos[i * 3] = -0.02 + u * 0.2 + (Math.random() - 0.5) * jit;
            pos[i * 3 + 1] = 0.51 - u * 0.08 + Math.sin(u * Math.PI) * 0.05 + (Math.random() - 0.5) * jit;
            pos[i * 3 + 2] = (Math.random() - 0.5) * jit;
          }
          sparkGeo.attributes.position.needsUpdate = true;
        }
      },
    });
  }

  // ---- top shelf: Arduino + CAN module + OBD-II plug ------------------------------------------------------------------
  {
    const g = new THREE.Group(); g.position.set(PX - 0.62, topY, 0.29);
    const tilt = new THREE.Group(); tilt.position.set(0, 0.085, -0.02); tilt.rotation.x = 0.85; g.add(tilt);
    g.add(at(box(0.52, 0.15, 0.03, mat('#17110d')), 0.09, 0.075, -0.1));                             // little easel behind the boards
    const pin = mat('#0d0e12', { roughness: 0.4 }), gold = metal('#d9b45a', 0.3);
    tilt.add(at(rbox(0.3, 0.012, 0.21, mat('#1f6f8f', { roughness: 0.45 }), 0.006), 0, 0.02, 0));    // Arduino board
    tilt.add(at(box(0.2, 0.028, 0.012, pin), 0.02, 0.04, -0.092)); tilt.add(at(box(0.16, 0.028, 0.012, pin), 0.04, 0.04, 0.092));
    for (let i = 0; i < 10; i++) tilt.add(at(box(0.006, 0.004, 0.006, gold), -0.07 + i * 0.02, 0.056, -0.092));
    tilt.add(at(rbox(0.06, 0.045, 0.065, steel, 0.004), -0.125, 0.048, -0.045));                    // USB port
    tilt.add(at(box(0.045, 0.04, 0.05, pin), -0.128, 0.046, 0.055));                                 // power jack
    tilt.add(at(box(0.13, 0.014, 0.03, pin), 0.02, 0.033, 0.02));                                    // the microcontroller chip
    for (let i = 0; i < 7; i++) for (const dz of [-0.017, 0.017]) tilt.add(at(box(0.005, 0.004, 0.006, steel), -0.035 + i * 0.018, 0.028, 0.02 + dz));
    tilt.add(at(rbox(0.03, 0.012, 0.012, steel, 0.004), -0.05, 0.032, -0.03));                       // crystal
    tilt.add(at(cyl(0.008, 0.008, 0.012, mat('#d8402f'), 10), -0.09, 0.034, 0.0));                   // reset button
    tilt.add(at(rbox(0.17, 0.012, 0.11, mat('#2456a8', { roughness: 0.45 }), 0.004), 0.32, 0.02, 0.01));   // MCP2515 module
    tilt.add(at(box(0.05, 0.035, 0.045, mat('#3aa655', { roughness: 0.5 })), 0.38, 0.044, 0.01));    // screw terminal
    tilt.add(at(box(0.04, 0.012, 0.03, pin), 0.3, 0.032, 0.02));
    tilt.add(at(rbox(0.028, 0.012, 0.012, steel, 0.004), 0.3, 0.032, -0.025));
    ['#d8402f', '#f0c060', '#3aa655', '#e8e8e8'].forEach((col, i) => {                               // jumper wires
      tilt.add(tube([[0.1 + i * 0.012, 0.05, 0.092], [0.15 + i * 0.012, 0.1 + i * 0.01, 0.07], [0.23, 0.09 + i * 0.008, 0.05 - i * 0.012], [0.255, 0.035, 0.045 - i * 0.014]], 0.003, mat(col, { roughness: 0.5 }), 14));
    });
    const ledA = new THREE.Mesh(new THREE.SphereGeometry(0.008, 10, 8), glow(0.2, 2.5, 0.6)); ledA.position.set(0.09, 0.032, 0.05); tilt.add(ledA);
    const ledB = new THREE.Mesh(new THREE.SphereGeometry(0.008, 10, 8), glow(2.6, 1.4, 0.2)); ledB.position.set(0.112, 0.032, 0.05); tilt.add(ledB);
    // OBD-II plug: wide at the top, narrower at the bottom, with two rows of pins
    const plug = new THREE.Group(); plug.position.set(0.66, 0.06, 0.03); plug.rotation.set(0, -0.35, 0); g.add(plug);
    plug.add(at(rbox(0.19, 0.05, 0.09, mat('#1b1d24', { roughness: 0.5 }), 0.012), 0, 0.025, 0));
    plug.add(at(rbox(0.16, 0.045, 0.09, mat('#1b1d24', { roughness: 0.5 }), 0.012), 0, -0.02, 0));
    plug.add(at(box(0.165, 0.035, 0.004, mat('#2c2f38')), 0, 0.022, 0.046)); plug.add(at(box(0.135, 0.03, 0.004, mat('#2c2f38')), 0, -0.02, 0.046));
    for (let i = 0; i < 8; i++) { plug.add(at(box(0.008, 0.014, 0.004, gold), -0.066 + i * 0.019, 0.022, 0.049)); if (i < 7) plug.add(at(box(0.008, 0.012, 0.004, gold), -0.056 + i * 0.019, -0.02, 0.049)); }
    g.add(tube([[0.41, 0.1, 0.0], [0.47, 0.02, 0.09], [0.54, 0.014, 0.11], [0.6, 0.05, 0.03]], 0.008, mat('#0d0e12', { roughness: 0.5 }), 20));
    register('can', g, {
      tick: (t, dt, h) => {
        const rate = 2 + h * 16;
        ledA.visible = Math.sin(t * rate) > 0; ledB.visible = Math.sin(t * rate * 1.7 + 1) > 0.2;
        plug.position.y = 0.06 + h * 0.03;
      },
    });
  }

  // ---- top shelf: books (skills) ---------------------------------------------------------------------------------------
  {
    const g = new THREE.Group(); g.position.set(PX + 0.72, topY, 0.28);
    const specs = [[0.06, 0.34, '#5ee0c8'], [0.05, 0.3, '#c98a3a'], [0.07, 0.38, '#8a6bd1'], [0.045, 0.31, '#e3ddd0'], [0.06, 0.35, '#d86a5a'], [0.05, 0.29, '#4f8fd8'], [0.055, 0.33, '#2f333d']];
    const titles = ['Vehicle Dynamics', 'Control Systems', 'Electric Drives', 'Power Electronics', 'Embedded C', 'Signals & Systems', 'MATLAB & Simulink'];
    const books = []; let x = 0;
    for (const [w, h, col] of specs) {
      const b = rbox(w, h, 0.22, mat(col, { roughness: 0.7 }), 0.006); b.position.set(x + w / 2, h / 2, 0); g.add(b); books.push(b); x += w + 0.004;
      const sc = makeCanvas(64, 384), title = titles[books.length - 1], st = canvasTexture(sc);
      const redraw = () => { drawSpine(sc, title, col); st.needsUpdate = true; }; redraw(); room.refreshers.push(redraw);   // again once the font loads
      const spine = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.006, h - 0.008), mat('#ffffff', { map: st, roughness: 0.65 }));
      spine.position.z = 0.1105; b.add(spine);
      b.add(at(box(w - 0.012, 0.004, 0.2, mat('#efe9db')), 0, h / 2 - 0.004, 0));                    // page edges on top
    }
    g.add(rot(at(rbox(0.05, 0.3, 0.22, mat('#1f6f8f', { roughness: 0.7 }), 0.006), x + 0.07, 0.145, 0), 0, 0, -0.3));
    g.add(at(box(0.004, 0.2, 0.14, metal('#15171c', 0.4)), -0.006, 0.1, 0)); g.add(at(box(0.1, 0.004, 0.14, metal('#15171c', 0.4)), -0.055, 0.002, 0));   // bookend
    register('skills', g, { tick: (t, dt, h) => books.forEach((b, i) => { b.position.z = h * 0.07 * (0.5 + 0.5 * Math.sin(t * 3 + i * 0.9)); }) });
  }

  // ---- lower shelf: DC motor on a test stand + oscilloscope (NN-MPC) -------------------------------------------------------
  {
    const g = new THREE.Group(); g.position.set(PX - 1.32, lowY, 0.28);
    g.add(at(rbox(0.46, 0.026, 0.24, mat('#2f333d', { roughness: 0.5, metalness: 0.4 }), 0.006), 0, 0.013, 0));
    for (const [dx, dz] of [[-0.2, -0.09], [-0.2, 0.09], [0.2, -0.09], [0.2, 0.09]]) g.add(at(cyl(0.01, 0.01, 0.006, steel, 8), dx, 0.029, dz));   // bolts
    const bodyM = metal('#8c919c', 0.35), capM = mat('#3d424d', { metalness: 0.5, roughness: 0.4 });
    g.add(rot(at(cyl(0.082, 0.082, 0.24, bodyM), -0.07, 0.135, 0), 0, 0, Math.PI / 2));
    for (let i = 0; i < 7; i++) g.add(rot(at(cyl(0.089, 0.089, 0.008, bodyM, 28), -0.15 + i * 0.027, 0.135, 0), 0, 0, Math.PI / 2));     // cooling fins
    for (const dx of [-0.2, 0.06]) g.add(rot(at(cyl(0.086, 0.08, 0.024, capM), dx, 0.135, 0), 0, 0, dx < 0 ? Math.PI / 2 : -Math.PI / 2));
    g.add(at(rbox(0.07, 0.04, 0.06, capM, 0.006), -0.07, 0.235, 0));                                // terminal box
    for (const dx of [-0.16, 0.02]) g.add(at(box(0.03, 0.06, 0.2, capM), dx, 0.056, 0));             // mounting feet
    const spin = new THREE.Group(); spin.position.set(0.07, 0.135, 0); g.add(spin);
    spin.add(rot(at(cyl(0.011, 0.011, 0.14, steel, 12), 0.07, 0, 0), 0, 0, Math.PI / 2));
    spin.add(rot(at(cyl(0.028, 0.028, 0.04, mat('#d8402f', { roughness: 0.5 }), 16), 0.05, 0, 0), 0, 0, Math.PI / 2));   // flexible coupling
    spin.add(rot(at(cyl(0.058, 0.058, 0.014, copper), 0.12, 0, 0), 0, 0, Math.PI / 2));              // load disc
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; spin.add(rot(at(cyl(0.008, 0.008, 0.016, black, 8), 0.12, Math.cos(a) * 0.038, Math.sin(a) * 0.038), 0, 0, Math.PI / 2)); }
    spin.add(at(box(0.018, 0.02, 0.012, black), 0.12, 0.05, 0));
    g.add(at(box(0.03, 0.15, 0.06, capM), 0.2, 0.1, 0));                                             // bearing post for the shaft end
    // oscilloscope
    const sc = new THREE.Group(); sc.position.set(0.55, 0, 0.0); g.add(sc);
    const caseM = mat('#b9bec8', { roughness: 0.5 });
    sc.add(at(rbox(0.42, 0.27, 0.2, caseM, 0.018), 0, 0.145, 0));
    for (const dx of [-0.17, 0.17]) sc.add(at(cyl(0.012, 0.012, 0.012, black, 10), dx, 0.006, 0.06));
    sc.add(at(rbox(0.3, 0.02, 0.03, mat('#3d424d'), 0.008), 0, 0.295, 0));                           // carry handle
    for (const dx of [-0.14, 0.14]) sc.add(at(box(0.02, 0.03, 0.02, mat('#3d424d')), dx, 0.283, 0));
    sc.add(at(rbox(0.275, 0.195, 0.004, dark, 0.006), -0.055, 0.155, 0.1));
    const c = makeCanvas(320, 220); const tex = canvasTexture(c);
    const scr = screen(0.25, 0.17, tex); scr.position.set(-0.055, 0.155, 0.103); sc.add(scr);
    for (const dy of [0.215, 0.15]) {
      sc.add(rot(at(cyl(0.017, 0.017, 0.02, mat('#3d424d'), 16), 0.14, dy, 0.108), Math.PI / 2, 0, 0));
      sc.add(at(box(0.004, 0.014, 0.002, mat('#f2f4f8')), 0.14, dy + 0.008, 0.119));
    }
    for (let i = 0; i < 4; i++) sc.add(at(rbox(0.018, 0.012, 0.006, mat(i === 0 ? ACCENT : '#6d727d'), 0.002), 0.107 + (i % 2) * 0.03, 0.105 - Math.floor(i / 2) * 0.02, 0.102));
    for (const dx of [-0.12, -0.02]) sc.add(rot(at(cyl(0.012, 0.012, 0.022, steel, 12), dx, 0.04, 0.108), Math.PI / 2, 0, 0));     // probe sockets
    g.add(tube([[0.43, 0.04, 0.12], [0.36, 0.02, 0.17], [0.16, 0.02, 0.15], [0.02, 0.1, 0.1], [-0.05, 0.25, 0.03]], 0.004, mat('#15171c', { roughness: 0.5 }), 26));   // probe lead to the motor
    g.add(tube([[-0.09, 0.25, -0.02], [-0.2, 0.3, -0.08], [-0.26, 0.05, -0.1], [-0.3, 0.02, -0.02]], 0.004, mat('#d8402f', { roughness: 0.5 }), 20));
    let p = 1, was = 0, last = -1;
    const redraw = () => { drawScope(c, p); tex.needsUpdate = true; };
    redraw(); room.refreshers.push(redraw);
    register('mpc', g, {
      tick: (t, dt, h) => {
        if (h > 0.5 && was <= 0.5) p = 0;
        was = h;
        p = Math.min(1, p + dt * 0.55);
        const shown = Math.round(p * 120);
        if (shown !== last) { last = shown; redraw(); }
        spin.rotation.x += dt * (1.2 + h * 16);
      },
    });
  }

  // ---- lower shelf decor: headphones on a stand, a little model car, a fern --------------------------------------------------
  {
    const hx = PX - 0.3, hz = 0.28;
    scene.add(at(cyl(0.07, 0.075, 0.014, black, 24), hx, lowY + 0.007, hz));
    scene.add(at(cyl(0.008, 0.008, 0.26, alu, 10), hx, lowY + 0.14, hz));
    scene.add(rot(at(cyl(0.02, 0.02, 0.09, black, 12), hx, lowY + 0.275, hz), 0, 0, Math.PI / 2));
    const band = shadow(new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.011, 10, 24, Math.PI), mat('#1b1d24', { roughness: 0.6 }))); band.position.set(hx, lowY + 0.21, hz); scene.add(band);
    for (const s of [-1, 1]) {
      scene.add(rot(at(cyl(0.048, 0.048, 0.035, mat('#1b1d24', { roughness: 0.6 }), 20), hx + s * 0.088, lowY + 0.185, hz), 0, 0, Math.PI / 2));
      scene.add(rot(at(cyl(0.04, 0.04, 0.012, mat('#3a3e49', { roughness: 0.9 }), 20), hx + s * 0.066, lowY + 0.185, hz), 0, 0, Math.PI / 2));
      scene.add(rot(at(cyl(0.02, 0.02, 0.003, metal(ACCENT, 0.3), 16), hx + s * 0.1065, lowY + 0.185, hz), 0, 0, Math.PI / 2));
    }
    // model car
    const car = new THREE.Group(); car.position.set(PX + 0.32, lowY, 0.3); car.rotation.y = 0.45; scene.add(car);
    const paint = new THREE.MeshPhysicalMaterial({ color: '#1f8f7d', roughness: 0.25, metalness: 0.4, clearcoat: 1, clearcoatRoughness: 0.1 });
    car.add(at(rbox(0.3, 0.05, 0.125, paint, 0.022), 0, 0.055, 0));
    car.add(at(rbox(0.16, 0.045, 0.11, mat('#11141a', { roughness: 0.15, metalness: 0.5 }), 0.02), -0.015, 0.095, 0));
    for (const [dx, dz] of [[-0.095, -0.062], [-0.095, 0.062], [0.095, -0.062], [0.095, 0.062]]) {
      car.add(rot(at(cyl(0.028, 0.028, 0.02, mat('#0c0d10', { roughness: 0.8 }), 16), dx, 0.028, dz), Math.PI / 2, 0, 0));
      car.add(rot(at(cyl(0.015, 0.015, 0.022, alu, 10), dx, 0.028, dz), Math.PI / 2, 0, 0));
    }
    for (const dz of [-0.04, 0.04]) car.add(at(box(0.004, 0.012, 0.03, glow(2.4, 2.3, 2.0)), 0.151, 0.06, dz));
    car.add(at(box(0.004, 0.008, 0.1, glow(2.2, 0.3, 0.3)), -0.151, 0.065, 0));
    car.add(at(rbox(0.36, 0.012, 0.16, mat('#1a130e', { roughness: 0.6 }), 0.004), 0, 0.006, 0));
    // fern
    const fx = PX + 0.84;
    scene.add(at(cyl(0.06, 0.045, 0.09, mat('#d9d2c2', { roughness: 0.6 })), fx, lowY + 0.045, 0.28));
    const fernMats = ['#3f8a55', '#4a9960', '#357a4b'].map((cc) => mat(cc, { roughness: 0.6, side: THREE.DoubleSide }));
    for (let i = 0; i < 11; i++) {
      const holder = new THREE.Group(); holder.position.set(fx, lowY + 0.085, 0.28); holder.rotation.y = i * 2.4; scene.add(holder);
      const l = leaf(0.12 + (i % 3) * 0.03, 0.045, fernMats[i % 3], 0.5); l.rotation.x = 0.35 + (i % 4) * 0.2; holder.add(l);
    }
  }

  // ---- lower shelf: "about me" photo frame -----------------------------------------------------------------------------------
  {
    const g = new THREE.Group(); g.position.set(PX + 1.36, lowY, 0.31);
    const tilt = new THREE.Group(); tilt.rotation.x = -0.16; g.add(tilt);
    tilt.add(at(rbox(0.31, 0.37, 0.022, mat('#3b2a20', { roughness: 0.45 }), 0.006), 0, 0.185, 0));
    tilt.add(at(box(0.275, 0.335, 0.002, mat('#ece7de', { roughness: 0.9 })), 0, 0.185, 0.0115));
    const c = makeCanvas(256, 312); drawPortrait(c);
    const pic = screen(0.225, 0.275, canvasTexture(c)); pic.position.set(0, 0.185, 0.0135); tilt.add(pic);
    g.add(rot(at(box(0.04, 0.3, 0.008, mat('#3b2a20')), 0, 0.14, -0.07), 0.35, 0, 0));               // back stand
    if (photoUrl) new THREE.TextureLoader().load(photoUrl, (t) => { t.colorSpace = THREE.SRGBColorSpace; pic.material.map = t; pic.material.needsUpdate = true; });
    register('about', g, { tick: (t, dt, h) => { tilt.rotation.y = Math.sin(t * 2.4) * 0.12 * h; tilt.scale.setScalar(1 + 0.06 * h); } });
  }

  // ---- education plaque on the wall ---------------------------------------------------------------------------------------------
  {
    const g = new THREE.Group(); g.position.set(LAYOUT.PLAQUE_X, 2.2, 0.0);
    const hang = new THREE.Group(); hang.position.y = 0.38; g.add(hang);
    hang.add(at(cyl(0.008, 0.008, 0.02, steel, 8), 0, 0, 0.01).rotateX(Math.PI / 2));
    hang.add(at(rbox(0.6, 0.74, 0.03, mat('#3b2a20', { roughness: 0.4 }), 0.008), 0, -0.38, 0.02));
    hang.add(at(box(0.54, 0.68, 0.002, mat('#ece7de', { roughness: 0.9 })), 0, -0.38, 0.036));
    const c = makeCanvas(320, 410); const tex = canvasTexture(c);
    const redraw = () => { drawPlaque(c); tex.needsUpdate = true; }; redraw(); room.refreshers.push(redraw);
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.58), mat('#ffffff', { map: tex, roughness: 0.9 }));
    pic.position.set(0, -0.38, 0.038); hang.add(pic);
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.68), glass(0.1)); gl.position.set(0, -0.38, 0.041); hang.add(gl);
    register('education', g, { tick: (t, dt, h) => { hang.rotation.z = Math.sin(t * 3.2) * 0.035 * h; } });
  }

  // ---- hub-motor wheel, motor controller and battery pack (smart wheelchair) --------------------------------------------------------
  {
    const g = new THREE.Group(); g.position.set(WIN.x - 0.2, 0, 0.3);
    const leanG = new THREE.Group(); leanG.rotation.x = -0.17; g.add(leanG);
    const spin = new THREE.Group(); spin.position.y = 0.35; leanG.add(spin);
    const rubber = mat('#0d0e12', { roughness: 0.92 });
    spin.add(torus(0.3, 0.042, rubber));
    for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2; spin.add(rot(at(box(0.03, 0.012, 0.06, rubber), Math.cos(a) * 0.342, Math.sin(a) * 0.342, 0), 0, 0, a + Math.PI / 2)); }   // tread
    spin.add(torus(0.255, 0.014, steel));
    spin.add(rot(cyl(0.12, 0.12, 0.085, mat('#3d424d', { roughness: 0.35, metalness: 0.7 })), Math.PI / 2, 0, 0));      // hub motor
    spin.add(rot(cyl(0.085, 0.085, 0.09, mat(ACCENT, { roughness: 0.4, emissive: ACCENT, emissiveIntensity: 0.25 })), Math.PI / 2, 0, 0));
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; spin.add(rot(at(cyl(0.008, 0.008, 0.092, steel, 8), Math.cos(a) * 0.105, Math.sin(a) * 0.105, 0), Math.PI / 2, 0, 0)); }
    spin.add(rot(cyl(0.022, 0.022, 0.16, steel, 12), Math.PI / 2, 0, 0));                               // axle
    spin.add(rot(at(cyl(0.032, 0.032, 0.014, steel, 6), 0, 0, 0.06), Math.PI / 2, 0, 0));               // axle nut
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; spin.add(rot(at(cyl(0.0035, 0.0035, 0.14, steel, 6), Math.cos(a) * 0.185, Math.sin(a) * 0.185, (i % 2 ? 0.012 : -0.012)), 0, 0, a + Math.PI / 2)); }
    // controller with cooling fins
    const ctrl = new THREE.Group(); ctrl.position.set(0.58, 0, 0.1); g.add(ctrl);
    ctrl.add(at(rbox(0.26, 0.07, 0.16, alu, 0.008), 0, 0.035, 0));
    for (let i = 0; i < 9; i++) ctrl.add(at(box(0.012, 0.025, 0.15, alu), -0.1 + i * 0.025, 0.08, 0));
    ctrl.add(at(box(0.05, 0.04, 0.06, black), 0.14, 0.035, 0));
    // battery pack
    const pack = new THREE.Group(); pack.position.set(0.98, 0, 0.14); pack.rotation.y = -0.2; g.add(pack);
    pack.add(at(rbox(0.36, 0.19, 0.2, mat('#22262f', { roughness: 0.5 }), 0.022), 0, 0.095, 0));
    pack.add(at(box(0.3, 0.05, 0.002, mat('#f0c060', { roughness: 0.6 })), 0, 0.06, 0.101));
    for (let i = 0; i < 4; i++) pack.add(at(box(0.03, 0.018, 0.002, glow(0.3, i < 3 ? 2.2 : 0.3, i < 3 ? 1.8 : 0.3)), -0.06 + i * 0.04, 0.14, 0.101));    // charge level
    pack.add(at(rbox(0.16, 0.012, 0.03, black, 0.005), 0, 0.215, 0)); for (const dx of [-0.07, 0.07]) pack.add(at(box(0.012, 0.03, 0.03, black), dx, 0.2, 0));   // handle
    pack.add(at(cyl(0.014, 0.014, 0.02, mat('#d8402f'), 10), -0.13, 0.2, 0.05)); pack.add(at(cyl(0.014, 0.014, 0.02, black, 10), 0.13, 0.2, 0.05));
    ['#f0c060', '#3aa655', '#4f8fd8'].forEach((col, i) => g.add(tube([[0.02, 0.36, 0.03], [0.14, 0.2 + i * 0.02, 0.1 + i * 0.012], [0.3, 0.04, 0.1 + i * 0.02], [0.45, 0.04, 0.06 + i * 0.03]], 0.006, mat(col, { roughness: 0.5 }), 20)));   // three phase wires
    g.add(tube([[0.72, 0.04, 0.12], [0.8, 0.02, 0.2], [0.88, 0.1, 0.2], [0.9, 0.2, 0.19]], 0.006, mat('#d8402f', { roughness: 0.5 }), 16));
    g.add(tube([[0.72, 0.04, 0.08], [0.84, 0.02, 0.26], [1.0, 0.1, 0.26], [1.14, 0.2, 0.2]], 0.006, black, 16));
    register('wheelchair', g, { tick: (t, dt, h) => { spin.rotation.z -= dt * (0.25 + h * 7); } });
  }

  // ---- the waste-sorting dustbin (design patent) -----------------------------------------------------------------------------------------
  {
    const g = new THREE.Group(); g.position.set(LAYOUT.PLAQUE_X - 0.12, 0, 0.8); g.rotation.y = 0.3;
    const shell = mat('#c3c8d1', { roughness: 0.3, envMapIntensity: 0.9 });
    g.add(at(rbox(0.46, 0.04, 0.4, mat('#4a4e59', { roughness: 0.5 }), 0.015), 0, 0.02, 0));           // plinth
    g.add(at(rbox(0.44, 0.6, 0.38, shell, 0.05), 0, 0.33, 0));
    g.add(at(box(0.36, 0.01, 0.3, mat('#15171c', { roughness: 0.8 })), 0, 0.631, 0));                  // dark opening under the lid
    g.add(at(box(0.008, 0.012, 0.3, mat('#6d727d')), 0, 0.636, 0));                                    // divider between two compartments
    g.add(at(rbox(0.27, 0.15, 0.012, mat('#8c919c', { roughness: 0.4 }), 0.006), 0, 0.43, 0.186));     // recessed bezel
    g.add(at(rbox(0.235, 0.11, 0.006, mat('#0d0f14', { roughness: 0.2 }), 0.004), 0, 0.43, 0.192));    // display
    g.add(at(new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.01), glow(0.4, 2.2, 1.9)), 0, 0.445, 0.196));
    [[0.3, 2.0, 0.7], [0.4, 1.0, 2.4], [2.4, 1.6, 0.3]].forEach((cc, i) => g.add(at(new THREE.Mesh(new THREE.CircleGeometry(0.009, 12), glow(...cc)), -0.05 + i * 0.05, 0.41, 0.196)));
    for (let i = 0; i < 3; i++) g.add(at(box(0.05, 0.005, 0.004, mat('#15171c')), 0, 0.3 - i * 0.014, 0.191));   // microphone grille
    const support = metal('#8c919c', 0.3);
    for (const dx of [-0.24, 0.24]) {
      g.add(at(rbox(0.028, 0.3, 0.06, support, 0.01), dx, 0.55, -0.12));
      g.add(rot(at(torus(0.035, 0.008, support, 20), dx, 0.47, -0.12), 0, Math.PI / 2, 0));          // ornamental ring
      g.add(at(ball(0.026, support, 14), dx, 0.715, -0.12));
    }
    g.add(rot(at(cyl(0.012, 0.012, 0.5, support, 10), 0, 0.7, -0.12), 0, 0, Math.PI / 2));             // hinge bar
    const lid = new THREE.Group(); lid.position.set(0, 0.7, -0.12); g.add(lid);
    lid.add(at(rbox(0.45, 0.04, 0.41, mat('#d3d7de', { roughness: 0.28, envMapIntensity: 0.9 }), 0.018), 0, -0.045, 0.135));
    lid.add(at(rbox(0.12, 0.012, 0.03, mat('#8c919c', { roughness: 0.4 }), 0.004), 0, -0.03, 0.335));  // lip to lift it by
    register('patent', g, { tick: (t, dt, h) => { lid.rotation.x = -h * 1.05; } });
  }

  // ---- electrical control cabinet (Vinadith internship) --------------------------------------------------------------------------------------
  {
    const g = new THREE.Group(); g.position.set(LAYOUT.CABINET_X, 1.72, 0);
    const paintM = mat('#8a8f99', { roughness: 0.45, metalness: 0.35, envMapIntensity: 0.8 });
    const chrome = metal('#d5d9e0', 0.15);
    g.add(at(rbox(0.95, 1.35, 0.3, paintM, 0.02), 0, 0, 0.15));
    for (const [dx, dy] of [[-0.42, 0.72], [0.42, 0.72], [-0.42, -0.72], [0.42, -0.72]]) g.add(at(box(0.08, 0.1, 0.01, paintM), dx, dy, 0.006));    // wall lugs
    g.add(at(rbox(0.87, 1.27, 0.022, mat('#989da7', { roughness: 0.42, metalness: 0.35, envMapIntensity: 0.8 }), 0.014), 0, 0, 0.306));           // door
    for (const dy of [0.42, -0.42]) g.add(at(cyl(0.014, 0.014, 0.1, chrome, 10), -0.45, dy, 0.31));    // hinges
    const dial = makeCanvas(128, 128), dg = dial.getContext('2d');
    dg.fillStyle = '#efe9db'; dg.beginPath(); dg.arc(64, 64, 62, 0, Math.PI * 2); dg.fill(); dg.strokeStyle = '#23262e'; dg.lineWidth = 3;
    for (let i = 0; i <= 10; i++) { const ang = Math.PI * (7 / 6) + (i / 10) * Math.PI * (2 / 3); dg.beginPath(); dg.moveTo(64 + Math.cos(ang) * 44, 64 + Math.sin(ang) * 44); dg.lineTo(64 + Math.cos(ang) * 56, 64 + Math.sin(ang) * 56); dg.stroke(); }
    const dialTex = canvasTexture(dial);
    const needles = [];
    for (const dx of [-0.19, 0.19]) {
      g.add(rot(at(cyl(0.125, 0.125, 0.024, mat('#15171c', { roughness: 0.4 }), 36), dx, 0.37, 0.325), Math.PI / 2, 0, 0));
      const f = new THREE.Mesh(new THREE.CircleGeometry(0.11, 36), mat('#ffffff', { map: dialTex, roughness: 0.7 })); f.position.set(dx, 0.37, 0.338); g.add(f);
      const n = new THREE.Group(); n.position.set(dx, 0.335, 0.342); n.add(at(box(0.006, 0.1, 0.003, mat('#d8402f')), 0, 0.05, 0)); g.add(n); needles.push(n);
      const gl = new THREE.Mesh(new THREE.CircleGeometry(0.11, 36), glass(0.12)); gl.position.set(dx, 0.37, 0.346); g.add(gl);
    }
    const lampSpecs = [[-0.27, [2.6, 0.5, 0.4], '#5a2420'], [-0.09, [2.8, 1.8, 0.3], '#5a4718'], [0.09, [0.4, 2.6, 1.0], '#1c4a36']];
    const lamps = lampSpecs.map(([dx, on, off]) => {
      g.add(rot(at(cyl(0.045, 0.045, 0.014, chrome, 20), dx, 0.1, 0.322), Math.PI / 2, 0, 0));
      const m = new THREE.MeshBasicMaterial({ color: off, toneMapped: false });
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.033, 16, 12), m); l.position.set(dx, 0.1, 0.328); l.scale.z = 0.6; g.add(l);
      return { m, on: new THREE.Color(...on), off: new THREE.Color(off) };
    });
    g.add(rot(at(cyl(0.05, 0.05, 0.012, mat('#f0c060', { roughness: 0.5 }), 24), 0.28, 0.1, 0.322), Math.PI / 2, 0, 0));      // emergency stop
    g.add(rot(at(cyl(0.036, 0.03, 0.04, mat('#d8402f', { roughness: 0.4 }), 20), 0.28, 0.1, 0.35), Math.PI / 2, 0, 0));
    for (const dx of [-0.27, -0.09]) {                                                                   // selector switches
      g.add(rot(at(cyl(0.038, 0.038, 0.014, chrome, 20), dx, -0.1, 0.322), Math.PI / 2, 0, 0));
      g.add(rot(at(rbox(0.016, 0.06, 0.02, black, 0.005), dx, -0.1, 0.338), 0, 0, dx < -0.2 ? 0.5 : -0.4));
    }
    g.add(at(box(0.3, 0.07, 0.003, mat('#15171c', { roughness: 0.5 })), 0.17, -0.1, 0.3185));             // nameplate
    g.add(at(box(0.26, 0.012, 0.004, mat('#d5d9e0')), 0.17, -0.09, 0.32)); g.add(at(box(0.18, 0.008, 0.004, mat('#8c919c')), 0.13, -0.115, 0.32));
    for (let i = 0; i < 6; i++) g.add(rot(at(box(0.5, 0.012, 0.03, mat('#70757f', { roughness: 0.5, metalness: 0.4 })), -0.1, -0.3 - i * 0.035, 0.322), 0.5, 0, 0));    // louvre vent
    g.add(at(rbox(0.035, 0.2, 0.04, black, 0.01), 0.37, -0.36, 0.335));                                   // door handle
    g.add(at(cyl(0.012, 0.012, 0.012, chrome, 10), 0.37, -0.3, 0.358).rotateX(Math.PI / 2));
    const tri = new THREE.Shape(); tri.moveTo(0, 0.055); tri.lineTo(-0.05, -0.03); tri.lineTo(0.05, -0.03); tri.closePath();
    const warn = new THREE.Mesh(new THREE.ShapeGeometry(tri), mat('#f0c060', { roughness: 0.6 })); warn.position.set(0.3, -0.56, 0.3185); g.add(warn);
    g.add(at(box(0.008, 0.035, 0.002, black), 0.3, -0.555, 0.3195));
    const steelPipe = metal('#7d828c', 0.4);
    for (const dx of [-0.25, 0.0, 0.25]) g.add(at(cyl(0.035, 0.035, 0.05, chrome, 14), dx, -0.7, 0.15));  // cable glands
    g.add(at(cyl(0.028, 0.028, 1.02, steelPipe, 14), 0.25, -1.2, 0.15));
    for (const dy of [-0.95, -1.45]) g.add(at(box(0.11, 0.03, 0.02, steelPipe), 0.25, dy, 0.02));
    g.add(tube([[0, -0.72, 0.15], [0.0, -1.1, 0.17], [-0.1, -1.5, 0.1], [-0.4, -1.69, 0.08], [-0.75, -1.7, 0.06]], 0.016, mat('#15171c', { roughness: 0.6 }), 30));
    g.add(tube([[-0.25, -0.72, 0.15], [-0.26, -1.0, 0.16], [-0.3, -1.3, 0.05], [-0.3, -1.5, 0.03]], 0.012, mat('#3d424d', { roughness: 0.6 }), 20));
    register('vinadith', g, {
      anchor: [LAYOUT.CABINET_X - 0.25, 2.5, 0.3],
      tick: (t, dt, h) => {
        needles[0].rotation.z = 0.75 - h * 1.25 + Math.sin(t * 5) * 0.03 * h;
        needles[1].rotation.z = 0.75 - h * 0.8 + Math.sin(t * 3.3 + 1) * 0.05 * h;
        lamps.forEach((l, i) => { const lit = h > 0.3 ? (Math.floor(t * 2.5) % 3 === i || (h > 0.95 && i === 2)) : i === 2; l.m.color.copy(lit ? l.on : l.off); });
      },
    });
  }

  void rnd;
  return room;
}
