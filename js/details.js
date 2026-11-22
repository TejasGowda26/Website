// details.js — small touches that make the room feel lived in. None of these are
// clickable: fairy lights on the curtain rod, a candle on the window sill, a
// fringe on the rug, a pen cup and a phone on the desk, and a light switch.

import * as THREE from 'three';
import { LAYOUT, mat, glass, glow, box, rbox, cyl, at, rot, rod, seededRandom } from './kit.js';

const { PX, DESK_Y, DESK_W, WIN } = LAYOUT;

export function buildDetails(scene) {
  const ticks = [];
  const add = (o) => { scene.add(o); return o; };
  const rnd = seededRandom(73);
  const wx0 = WIN.x - WIN.w / 2, wx1 = WIN.x + WIN.w / 2, wy0 = WIN.y - WIN.h / 2, wy1 = WIN.y + WIN.h / 2;

  // ---- fairy lights draped in swags along the curtain rod ----------------------------------------
  {
    const rodY = wy1 + 0.24, z = 0.2;
    const hooks = [wx0 - 0.48, wx0 + 0.25, WIN.x, wx1 - 0.25, wx1 + 0.48];
    const pts = [];
    for (let i = 0; i < hooks.length - 1; i++) {
      const a = hooks[i], b = hooks[i + 1];
      for (let k = 0; k < 14; k++) {
        const u = k / 14;
        pts.push(new THREE.Vector3(a + (b - a) * u, rodY + 0.01 - Math.sin(Math.PI * u) * 0.17, z + Math.sin(Math.PI * u) * 0.03));
      }
    }
    pts.push(new THREE.Vector3(hooks[hooks.length - 1], rodY + 0.01, z));
    const curve = new THREE.CatmullRomCurve3(pts);
    add(new THREE.Mesh(new THREE.TubeGeometry(curve, 160, 0.0025, 5), mat('#2b2a26', { roughness: 0.6 })));
    const N = 46;
    const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.014, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }), N);
    const m4 = new THREE.Matrix4(), warm = new THREE.Color(3.0, 1.75, 0.75), c = new THREE.Color();
    const phase = [];
    for (let i = 0; i < N; i++) {
      const p = curve.getPointAt((i + 0.5) / N);
      m4.makeTranslation(p.x, p.y - 0.016, p.z); bulbs.setMatrixAt(i, m4);
      bulbs.setColorAt(i, warm); phase.push(rnd() * 6.28);
    }
    add(bulbs);
    let acc = 0;
    ticks.push((t, dt) => {                                  // a slow, gentle twinkle
      acc += dt; if (acc < 0.08) return; acc = 0;
      for (let i = 0; i < N; i++) bulbs.setColorAt(i, c.copy(warm).multiplyScalar(0.72 + 0.28 * Math.sin(t * 1.3 + phase[i])));
      bulbs.instanceColor.needsUpdate = true;
    });
  }

  // ---- a candle in a glass jar on two books, on the window sill -------------------------------------
  {
    const x = wx1 - 0.38, y = wy0 + 0.005, z = 0.07;
    add(rot(at(rbox(0.19, 0.03, 0.13, mat('#6a3f52', { roughness: 0.7 }), 0.004), x, y + 0.015, z), 0, 0.12, 0));
    add(rot(at(rbox(0.17, 0.026, 0.12, mat('#d8cdb8', { roughness: 0.7 }), 0.004), x + 0.005, y + 0.043, z), 0, -0.08, 0));
    add(rot(at(box(0.15, 0.022, 0.106, mat('#f3ede0', { roughness: 0.9 })), x + 0.012, y + 0.043, z), 0, -0.08, 0));      // page edges
    const by = y + 0.056;
    add(at(cyl(0.042, 0.042, 0.09, glass(0.22), 28), x, by + 0.045, z));
    add(at(cyl(0.038, 0.038, 0.045, mat('#efe2c8', { roughness: 0.6, emissive: '#ff9a40', emissiveIntensity: 0.35 }), 24), x, by + 0.0235, z));
    add(at(cyl(0.0015, 0.0015, 0.014, mat('#15171c'), 6), x, by + 0.052, z));
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.008, 0.03, 10), glow(3.4, 2.0, 0.7));
    flame.position.set(x, by + 0.068, z); add(flame);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 8, 6), glow(4.0, 3.2, 2.0)); core.position.set(x, by + 0.062, z); add(core);
    ticks.push((t) => {
      const f = 0.85 + 0.1 * Math.sin(t * 9.1) + 0.06 * Math.sin(t * 23.7);
      flame.scale.set(1, f, 1); flame.rotation.z = Math.sin(t * 3.3) * 0.08;
    });
  }

  // ---- fringe on the two short ends of the rug -----------------------------------------------------
  {
    const cx = PX - 0.1, cz = 1.8, halfW = 3.7 / 2, depth = 2.4;
    const per = 72, N = per * 2;
    const strands = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 0.003, 0.007), mat('#d9cdb6', { roughness: 1 }), N);
    const o = new THREE.Object3D();
    for (let side = 0; side < 2; side++) for (let i = 0; i < per; i++) {
      const sx = side ? 1 : -1;
      o.position.set(cx + sx * (halfW + 0.032), 0.004, cz - depth / 2 + 0.04 + (i / (per - 1)) * (depth - 0.08));
      o.rotation.set(0, (rnd() - 0.5) * 0.35, 0); o.updateMatrix(); strands.setMatrixAt(side * per + i, o.matrix);
    }
    strands.receiveShadow = true; add(strands);
  }

  // ---- pen cup on the desk ---------------------------------------------------------------------------
  {
    const x = PX - DESK_W / 2 + 0.16, z = 0.66, y = DESK_Y;
    add(at(cyl(0.036, 0.033, 0.1, mat('#2f3a4a', { roughness: 0.4, metalness: 0.3 }), 24), x, y + 0.05, z));
    add(at(cyl(0.031, 0.031, 0.004, mat('#11131a'), 20), x, y + 0.097, z));
    const pens = [['#15171c', 0.16, 0.18, 0.0], ['#d8402f', 0.15, -0.16, 0.9], ['#e0b43a', 0.17, 0.08, 2.1], ['#4f8fd8', 0.14, -0.06, 3.6]];
    for (const [col, len, tilt, a] of pens) {
      const top = [x + Math.cos(a) * Math.sin(tilt) * len, y + 0.02 + len * Math.cos(tilt), z + Math.sin(a) * Math.sin(tilt) * len];
      add(rod([x + Math.cos(a) * 0.012, y + 0.02, z + Math.sin(a) * 0.012], top, 0.0045, mat(col, { roughness: 0.4 })));
    }
    add(rot(at(box(0.026, 0.2, 0.003, mat('#cfd3da', { roughness: 0.3, metalness: 0.6 })), x + 0.012, y + 0.12, z - 0.012), 0.12, 0.4, -0.1));      // a steel ruler
  }

  // ---- phone lying face down beside the wheel base --------------------------------------------------------
  {
    const g = new THREE.Group(); g.position.set(PX + 0.37, DESK_Y + 0.004, 1.0); g.rotation.y = 0.28; add(g);
    g.add(at(rbox(0.074, 0.008, 0.152, mat('#2a2f3a', { roughness: 0.25, metalness: 0.4 }), 0.004), 0, 0.004, 0));
    g.add(at(rbox(0.03, 0.004, 0.034, mat('#1a1d24', { roughness: 0.2, metalness: 0.5 }), 0.003), -0.016, 0.009, -0.05));
    for (const [dx, dz] of [[-0.024, -0.058], [-0.008, -0.058], [-0.016, -0.043]]) g.add(at(cyl(0.0055, 0.0055, 0.003, mat('#0b0c10', { roughness: 0.05, metalness: 0.2 }), 12), dx, 0.0115, dz));      // camera lenses
  }

  // ---- a light switch under the degree plaque -------------------------------------------------------------
  {
    const x = LAYOUT.PLAQUE_X, y = 1.22;
    add(at(rbox(0.15, 0.09, 0.01, mat('#ece7de', { roughness: 0.45 }), 0.008), x, y, 0.005));
    for (const dx of [-0.032, 0.032]) {
      add(at(rbox(0.05, 0.06, 0.012, mat('#e2ddd2', { roughness: 0.4 }), 0.005), x + dx, y, 0.012));
      add(at(box(0.008, 0.003, 0.002, glow(2.2, 1.2, 0.4)), x + dx, y - 0.022, 0.0185));     // little orange indicator
    }
  }

  return { ticks };
}
