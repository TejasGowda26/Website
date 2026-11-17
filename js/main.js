// main.js — runs the site: sets up the 3D view, moves the camera, and wires up
// the buttons, the side panel, the driving demo and the plain list view.

import * as THREE from 'three';
import { buildRoom } from './room.js';
import { TrafficDemo } from './demo.js';
import { profile, items, tourOrder } from './content.js';

const $ = (sel) => document.querySelector(sel);
const params = new URLSearchParams(location.search);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const byId = Object.fromEntries(items.map((it) => [it.id, it]));
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
// Updates the #part of the address bar so a view can be bookmarked or shared.
function setAddress(url) { try { history.replaceState(null, '', url); } catch (err) { /* some embedded viewers do not allow this */ } }

// Small helper to build HTML elements safely: el('p', { class: 'x' }, 'text')
function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === 'class') node.className = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) if (c != null && c !== false) node.append(c);
  return node;
}

// ---- the shared building blocks for one project / job ------------------------
function itemBody(item, headingTag) {
  const out = [];
  out.push(el('p', { class: 'kicker' }, item.kicker));
  out.push(el(headingTag, {}, item.title));
  if (item.summary) out.push(el('p', { class: 'summary' }, item.summary));
  if (item.stats?.length) out.push(el('div', { class: 'stats' }, item.stats.map((s) => el('div', { class: 'stat' }, el('b', {}, s.value), el('span', {}, s.label)))));
  if (item.points?.length) out.push(el('ul', { class: 'points' }, item.points.map((p) => el('li', {}, p))));
  if (item.groups?.length) out.push(el('dl', { class: 'groups' }, item.groups.map((g) => el('div', {}, el('dt', {}, g.name), el('dd', {}, g.list)))));
  if (item.tools?.length) out.push(el('ul', { class: 'tools', 'aria-label': 'Tools used' }, item.tools.map((t) => el('li', {}, t))));
  return out;
}

function contactLines() {
  return el('ul', { class: 'contact-lines' },
    el('li', {}, el('span', {}, 'Email'), el('a', { href: `mailto:${profile.email}` }, profile.email)),
    el('li', {}, el('span', {}, 'Phone'), el('a', { href: `tel:${profile.phone.replace(/\s/g, '')}` }, profile.phone)),
    el('li', {}, el('span', {}, 'GitHub'), el('a', { href: profile.github, target: '_blank', rel: 'noopener' }, profile.github.replace('https://', ''))),
    el('li', {}, el('span', {}, 'Based in'), profile.location));
}

// =============================================================================
//  The plain list view (also the fallback when 3D is not available)
// =============================================================================
const listEl = $('#list');
let app = null;      // filled in once the 3D room is running

function buildList() {
  const inSection = (name) => items.filter((it) => it.section === name);
  const card = (it) => el('article', { class: 'card', id: `card-${it.id}` },
    itemBody(it, 'h3'),
    el('button', { class: 'pill ghost see to-room', type: 'button', onclick: () => { closeList(); app?.focus(it.id); } }, 'See it in the room'));

  listEl.append(el('div', { class: 'wrap' },
    el('section', { id: 'about' },
      el('h1', {}, profile.name),
      el('p', { class: 'lead' }, profile.tagline),
      el('p', {}, profile.summary),
      el('div', { class: 'actions', style: 'margin-top:22px' },
        el('button', { class: 'pill solid to-room', type: 'button', onclick: closeList }, 'Explore the 3D room'),
        el('a', { class: 'pill', href: profile.resumePdf, download: true }, 'Download resume (PDF)'))),
    el('section', { id: 'projects' }, el('h2', {}, 'Projects'), el('div', { class: 'cards' }, inSection('projects').map(card))),
    el('section', { id: 'experience' }, el('h2', {}, 'Experience'), el('div', { class: 'cards' }, inSection('experience').map(card))),
    el('section', { id: 'skills' }, el('h2', {}, 'Skills'), el('dl', { class: 'groups' }, byId.skills.groups.map((g) => el('div', {}, el('dt', {}, g.name), el('dd', {}, g.list))))),
    el('section', { id: 'education' }, el('h2', {}, 'Education'), el('div', { class: 'cards' }, inSection('education').map(card))),
    el('section', { id: 'resume' }, el('h2', {}, 'Resume'),
      el('p', {}, 'Everything on this page, on one sheet.'),
      el('div', { class: 'actions', style: 'margin-top:16px' }, el('a', { class: 'pill solid', href: profile.resumePdf, download: true }, 'Download resume (PDF)'))),
    el('section', { id: 'contact' }, el('h2', {}, 'Contact'),
      contactLines(),
      el('form', { class: 'contact', action: profile.formEndpoint, method: 'POST' },
        el('label', {}, 'Your name', el('input', { name: 'name', type: 'text', required: true, autocomplete: 'name' })),
        el('label', {}, 'Your email', el('input', { name: 'email', type: 'email', required: true, autocomplete: 'email' })),
        el('label', {}, 'Message', el('textarea', { name: 'message', required: true })),
        el('button', { class: 'pill solid', type: 'submit' }, 'Send message')))));
}

function openList(section) {
  if (app) { app.exitDrive(); app.unfocus(); }
  listEl.hidden = false;
  document.body.classList.add('listing');
  $('#viewToggle').textContent = '3D room';
  const target = section && document.getElementById(section);
  if (target) target.scrollIntoView({ block: 'start' }); else listEl.scrollTop = 0;
  setAddress(`#${section || 'list'}`);
}
function closeList() {
  if (!app) return;
  listEl.hidden = true;
  document.body.classList.remove('listing');
  $('#viewToggle').textContent = 'Simple view';
  setAddress(location.pathname + location.search);
}

buildList();
document.querySelectorAll('.topbar [data-section]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); openList(a.dataset.section); }));
$('#viewToggle').addEventListener('click', () => (listEl.hidden ? openList() : closeList()));

// =============================================================================
//  The 3D room
// =============================================================================
function start3D() {
  const canvas = $('#scene');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (err) {
    return null;                         // no WebGL on this device: the list view takes over
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const FOV = 40;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 80);
  const tanHalf = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

  // ---- the monitor's driving demo and the room itself ------------------------------
  const demoCanvas = document.createElement('canvas'); demoCanvas.width = 1024; demoCanvas.height = 320;
  const demo = new TrafficDemo(demoCanvas);
  const clockHour = () => { const d = new Date(); return d.getHours() + d.getMinutes() / 60; };
  const fixedHour = params.has('hour') ? parseFloat(params.get('hour')) : null;   // e.g. ?hour=18.5 to preview dusk
  const room = buildRoom(scene, { demoCanvas, hour: fixedHour ?? clockHour(), photoUrl: profile.photo });
  const PX = room.LAYOUT.PX;             // centre line of the desk and monitor

  // ---- reflections: take a 360° snapshot of the room and let shiny things mirror it ----
  const pmrem = new THREE.PMREMGenerator(renderer);
  const cubeTarget = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
  const cubeCam = new THREE.CubeCamera(0.1, 90, cubeTarget); cubeCam.position.set(0.5, 1.5, 2.8);
  let envTarget = null;
  scene.environmentIntensity = 0.6;
  function refreshReflections() {
    cubeCam.update(renderer, scene);
    const fresh = pmrem.fromCubemap(cubeTarget.texture);
    scene.environment = fresh.texture;
    envTarget?.dispose(); envTarget = fresh;
  }
  const applyDaylight = () => { renderer.toneMappingExposure = 1.0 + 0.08 * room.daylight; };
  applyDaylight();
  if (fixedHour == null) setInterval(() => { room.setHour(clockHour()); applyDaylight(); refreshReflections(); }, 60000);
  document.fonts?.ready.then(() => room.refreshers.forEach((f) => f()));

  // ---- soft glow around bright things ("bloom"); skipped quietly if it fails to load ----
  let composer = null;
  Promise.all([
    import('three/addons/postprocessing/EffectComposer.js'),
    import('three/addons/postprocessing/RenderPass.js'),
    import('three/addons/postprocessing/UnrealBloomPass.js'),
    import('three/addons/postprocessing/OutputPass.js'),
    import('three/addons/postprocessing/GTAOPass.js'),
  ]).then(([ec, rp, bp, op, ao]) => {
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    const target = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
    const c = new ec.EffectComposer(renderer, target);
    c.addPass(new rp.RenderPass(scene, camera));
    // ambient occlusion: soft contact shadows where surfaces meet (under books, in corners)
    const gtao = new ao.GTAOPass(scene, camera, size.x, size.y);
    gtao.updateGtaoMaterial({ radius: 0.32, distanceExponent: 1.6, thickness: 1.3, scale: 1.25, samples: 12 });
    gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
    gtao.blendIntensity = 0.95;
    c.addPass(gtao);
    c.addPass(new bp.UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.2, 0.7, 1.25));
    c.addPass(new op.OutputPass());
    composer = c; resize();
  }).catch(() => { composer = null; });

  const touch = matchMedia('(pointer: coarse)').matches;
  if (touch) {
    $('#hint').textContent = 'Tap an object to open it. Drag to look around.';
    $('#hudText').textContent = 'Hold the arrow buttons to steer. Keep the green car in its lane.';
  }

  // ---- state ---------------------------------------------------------------------
  let W = 1, H = 1, mode = 'room';        // mode: 'room' | 'focus' | 'drive'
  let focusId = null, hoverId = null, panX = 0, panMax = 0, visHalf = 5;
  const pointer = new THREE.Vector2(0, 0);
  const cur = { pos: new THREE.Vector3(-1, 1.72, 7.5), target: new THREE.Vector3(0.55, 1.36, 0), sx: 0, sy: 0 };
  const goal = { pos: cur.pos.clone(), target: cur.target.clone(), sx: 0, sy: 0 };
  let firstLayout = true;
  // lowPower turns on by itself on slow devices. Add ?quality=low or ?quality=high to the address to force it.
  const forced = params.get('quality');
  let frames = 0, slowTime = 0, lowPower = forced === 'low';
  let snap = true;                        // jump straight to the goal (first frame, reduced motion)

  // The resting view: a little left of centre, looking slightly across the room.
  const VIEW = { lookX: 0.2, camOffset: -1.25, camY: 1.72, lookY: 1.42, halfWidth: 4.75 };
  function roomPose() {
    const aspect = W / H;
    const dist = clamp(VIEW.halfWidth / (tanHalf * aspect), 6.6, 13.5);
    visHalf = dist * tanHalf * aspect;
    panMax = Math.max(0, VIEW.halfWidth - visHalf + 0.4);
    panX = clamp(panX, -panMax, panMax);
    return { pos: new THREE.Vector3(VIEW.lookX + VIEW.camOffset + panX, VIEW.camY, dist), target: new THREE.Vector3(VIEW.lookX + panX, VIEW.lookY, 0), sx: 0, sy: 0 };
  }

  function focusPose(item) {
    const aspect = W / H, mobile = W <= 760;
    let pos, target;
    if (item.view) { pos = new THREE.Vector3(...item.view.pos); target = new THREE.Vector3(...item.view.target); }
    else {
      const r = Math.max(0.42, item.radius);
      const d = (r / tanHalf) * 1.5;
      target = item.center.clone();
      const side = -Math.sign(item.center.x - PX) * 0.16;     // look from slightly towards the middle of the room
      pos = target.clone().add(new THREE.Vector3(side * d, 0.17 * d, d));
    }
    const widen = clamp((mobile ? 1.0 : 1.5) / aspect, 1, 2.4);   // narrow windows step back
    pos = target.clone().add(pos.sub(target).multiplyScalar(widen));
    const panelW = Math.min(460, W);
    return { pos, target, sx: mobile ? 0 : panelW / 2, sy: mobile ? H * 0.29 : 0 };
  }

  function drivePose() {
    const aspect = W / H;
    const d = Math.max(2.15, 1.05 / (tanHalf * aspect));
    const my = room.LAYOUT.DESK_Y + 0.5;
    return { pos: new THREE.Vector3(PX, my + 0.06 + d * 0.06, 0.44 + d), target: new THREE.Vector3(PX, my - 0.04, 0.44), sx: 0, sy: H * 0.1 };
  }

  function setGoal(p) { goal.pos.copy(p.pos); goal.target.copy(p.target); goal.sx = p.sx; goal.sy = p.sy; if (reduceMotion) snap = true; }

  // ---- hotspots (dot + label per object) ----------------------------------------------
  const hotspotsEl = $('#hotspots');
  const hotspots = {};
  for (const id of tourOrder) {
    const it = byId[id];
    if (!room.items[id]) continue;
    const b = el('button', { class: 'hotspot', type: 'button', 'aria-label': `Open ${it.label}` },
      el('span', { class: 'dot' }), el('span', { class: 'name' }, it.label));
    b.addEventListener('click', () => focus(id));
    b.addEventListener('pointerenter', () => { hoverId = id; });
    b.addEventListener('pointerleave', () => { if (hoverId === id) hoverId = null; });
    b.addEventListener('focus', () => { hoverId = id; });
    b.addEventListener('blur', () => { if (hoverId === id) hoverId = null; });
    hotspotsEl.append(b); hotspots[id] = b;
  }

  // ---- side panel ----------------------------------------------------------------------
  const panel = $('#panel'), panelBody = $('#panelBody');
  function fillPanel(id) {
    const it = byId[id];
    panelBody.replaceChildren(...itemBody(it, 'h2'));
    const actions = [];
    if (it.drive) actions.push(el('button', { class: 'pill solid big', type: 'button', onclick: enterDrive }, 'Take the wheel'));
    if (it.resume) {
      actions.push(el('a', { class: 'pill solid big', href: profile.resumePdf, download: true }, 'Download resume (PDF)'));
      actions.push(el('button', { class: 'pill big', type: 'button', onclick: () => openList('about') }, 'Read it as a plain page'));
    }
    if (it.contact) { panelBody.append(contactLines()); actions.push(el('button', { class: 'pill big', type: 'button', onclick: () => openList('contact') }, 'Send a message')); }
    if (actions.length) panelBody.append(el('div', { class: 'actions' }, actions));
    const i = tourOrder.indexOf(id), n = tourOrder.length;
    const prev = byId[tourOrder[(i - 1 + n) % n]], next = byId[tourOrder[(i + 1) % n]];
    $('#panelPrev').textContent = 'Previous'; $('#panelPrev').setAttribute('aria-label', `Previous: ${prev.label}`);
    $('#panelPrev').onclick = () => focus(prev.id);
    $('#panelNext').textContent = `Next: ${next.label}`; $('#panelNext').onclick = () => focus(next.id);
    panel.scrollTop = 0;
  }

  function focus(id) {
    if (!room.items[id]) return;
    if (mode === 'drive') exitDrive(true);
    const fresh = mode !== 'focus';
    mode = 'focus'; focusId = id; hoverId = null;
    document.body.classList.add('focused');
    fillPanel(id);
    panel.hidden = false;
    if (fresh) { panel.style.animation = 'none'; void panel.offsetWidth; panel.style.animation = ''; $('#panelClose').focus({ preventScroll: true }); }
    setGoal(focusPose(room.items[id]));
    setAddress(`#${id}`);
  }

  function unfocus() {
    if (mode === 'room') return;
    if (mode === 'drive') exitDrive(true);
    const was = focusId;
    mode = 'room'; focusId = null;
    document.body.classList.remove('focused');
    panel.hidden = true;
    setGoal(roomPose());
    setAddress(location.pathname + location.search);
    void was;
  }

  // ---- driving the demo ---------------------------------------------------------------------
  const hud = $('#hud');
  const keys = { left: false, right: false };
  function enterDrive() {
    if (!listEl.hidden) closeList();
    mode = 'drive'; focusId = 'tja';
    document.body.classList.add('focused', 'driving');
    panel.hidden = true; hud.hidden = false;
    demo.setDriving(true);
    keys.left = keys.right = false;
    setGoal(drivePose());
    $('#assistToggle').focus({ preventScroll: true });
    setAddress('#drive');
  }
  function exitDrive(silent) {
    if (mode !== 'drive') return;
    demo.setDriving(false);
    hud.hidden = true; document.body.classList.remove('driving');
    mode = 'focus';
    if (silent !== true) focus('tja');
  }
  $('#driveExit').addEventListener('click', () => exitDrive());
  $('#assistToggle').addEventListener('click', (e) => {
    demo.assist = !demo.assist; demo.maxDrift = 0;
    e.currentTarget.setAttribute('aria-pressed', String(demo.assist));
    e.currentTarget.textContent = demo.assist ? 'Assist on' : 'Assist off';
    $('#hudText').textContent = demo.assist
      ? 'Assist is on: let go and it holds the lane. Steer firmly to change lanes.'
      : 'Assist is off: let go and watch the car wander, like a distracted driver.';
  });
  for (const [idName, side] of [['#steerLeft', 'left'], ['#steerRight', 'right']]) {
    const b = $(idName);
    b.addEventListener('pointerdown', (e) => { keys[side] = true; b.setPointerCapture(e.pointerId); });
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(ev, () => { keys[side] = false; });
  }
  const LEFT = ['ArrowLeft', 'ArrowUp', 'a', 'A', 'w', 'W'], RIGHT = ['ArrowRight', 'ArrowDown', 'd', 'D', 's', 'S'];
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!listEl.hidden) closeList(); else if (mode === 'drive') exitDrive(); else unfocus();
      return;
    }
    if (mode !== 'drive') return;
    if (LEFT.includes(e.key)) { keys.left = true; e.preventDefault(); }
    if (RIGHT.includes(e.key)) { keys.right = true; e.preventDefault(); }
  });
  addEventListener('keyup', (e) => { if (LEFT.includes(e.key)) keys.left = false; if (RIGHT.includes(e.key)) keys.right = false; });
  addEventListener('blur', () => { keys.left = keys.right = false; });

  $('#panelClose').addEventListener('click', unfocus);
  $('#cta').addEventListener('click', enterDrive);

  // ---- mouse / touch on the 3D view --------------------------------------------------------------
  const ray = new THREE.Raycaster();
  function pick(clientX, clientY) {
    const ndc = new THREE.Vector2((clientX / W) * 2 - 1, -(clientY / H) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(room.hits, false)[0];
    return hit ? hit.object.userData.id : null;
  }
  let down = null;
  canvas.addEventListener('pointermove', (e) => {
    pointer.set((e.clientX / W) * 2 - 1, -(e.clientY / H) * 2 + 1);
    if (down && mode === 'room' && panMax > 0) {
      panX = clamp(down.pan - (e.clientX - down.x) * ((2 * visHalf) / W), -panMax, panMax);
      setGoal(roomPose());
    }
    if (e.pointerType === 'mouse' && mode !== 'drive') {
      hoverId = pick(e.clientX, e.clientY);
      canvas.classList.toggle('point', !!hoverId);
    }
  });
  canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, pan: panX }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointerup', (e) => {
    const moved = down ? Math.hypot(e.clientX - down.x, e.clientY - down.y) : 99;
    down = null;
    if (moved > 8 || mode === 'drive') return;
    const id = pick(e.clientX, e.clientY);
    if (id) focus(id); else if (mode === 'focus') unfocus();
  });
  canvas.addEventListener('pointerleave', () => { if (!down) { hoverId = null; canvas.classList.remove('point'); } });

  // ---- window size ------------------------------------------------------------------------------------
  function resize() {
    W = innerWidth; H = innerHeight;
    renderer.setPixelRatio(lowPower ? 1 : Math.min(devicePixelRatio, 2));
    renderer.setSize(W, H, false);
    composer?.setSize(W, H);
    camera.aspect = W / H;
    roomPose();                                       // works out how far the view can pan on this screen
    if (firstLayout && panMax > 0) panX = Math.min(panMax, PX - VIEW.lookX);   // on phones, start centred on the desk
    firstLayout = false;
    setGoal(mode === 'room' ? roomPose() : mode === 'drive' ? drivePose() : focusPose(room.items[focusId]));
  }
  addEventListener('resize', resize);
  resize();

  // ---- the loop that runs every frame --------------------------------------------------------------------
  const clock = new THREE.Clock();
  const v = new THREE.Vector3();
  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.1), t = clock.elapsedTime;
    if (!listEl.hidden) return;                       // nothing to draw while the plain list is open

    // camera glides towards its goal
    const k = snap ? 1 : 1 - Math.exp(-dt * 3.4);
    snap = false;
    cur.pos.lerp(goal.pos, k); cur.target.lerp(goal.target, k);
    cur.sx += (goal.sx - cur.sx) * k; cur.sy += (goal.sy - cur.sy) * k;
    const sway = mode === 'room' && !reduceMotion ? 1 : mode === 'focus' && !reduceMotion ? 0.25 : 0;
    camera.position.set(cur.pos.x + pointer.x * 0.3 * sway, cur.pos.y + pointer.y * 0.14 * sway, cur.pos.z);
    camera.lookAt(cur.target);
    if (Math.abs(cur.sx) > 0.5 || Math.abs(cur.sy) > 0.5) camera.setViewOffset(W, H, cur.sx, cur.sy, W, H); else camera.clearViewOffset();
    camera.updateProjectionMatrix();

    // driving demo
    demo.update(dt, mode === 'drive' ? (keys.right ? 1 : 0) - (keys.left ? 1 : 0) : 0);
    demo.draw(); room.demoTexture.needsUpdate = true;
    room.wheel.rotation.z = -(demo.steer * 1.5 + demo.torque * 0.7);

    room.tick(t, dt);                                 // curtains, leaves, dust, clock, train

    // each object's little animation (h = how "hovered" it is, 0 to 1)
    for (const id in room.items) {
      const it = room.items[id];
      const want = (id === hoverId && mode !== 'drive') || id === focusId ? 1 : 0;
      it.hover += (want - it.hover) * Math.min(1, dt * 6);
      it.tick?.(t, dt, it.hover);
    }

    // keep each dot glued to its object
    if (mode === 'room') {
      for (const id in hotspots) {
        v.copy(room.items[id].anchor).project(camera);
        const x = (v.x * 0.5 + 0.5) * W, y = (-v.y * 0.5 + 0.5) * H;
        const b = hotspots[id];
        b.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        b.classList.toggle('on', id === hoverId);
      }
    }

    if (composer && !lowPower) composer.render(); else renderer.render(scene, camera);
    if (++frames === 2) { refreshReflections(); $('#loading').classList.add('done'); }

    // If the first couple of seconds run slowly, switch off the glow effect and
    // draw at a lower resolution so older laptops and phones stay smooth.
    if (!lowPower && forced !== 'high' && frames > 20 && frames <= 110) {
      slowTime += dt;
      if (frames === 110 && slowTime / 90 > 0.045) { lowPower = true; renderer.setPixelRatio(1); renderer.setSize(W, H, false); }
    }
  }
  frame();

  return { focus, unfocus, enterDrive, exitDrive, demo, room, camera, scene, renderer };
}

app = start3D();
if (!app) {
  document.body.classList.add('no-webgl');
  $('#loading').classList.add('done');
  openList(location.hash.slice(1));
} else {
  const h = location.hash.slice(1);
  if (params.has('simple')) openList();
  else if (h === 'drive') app.enterDrive();
  else if (byId[h]) app.focus(h);
  else if (h) openList(h);
  window.__app = app;                    // handy for poking at things in the browser console
}
