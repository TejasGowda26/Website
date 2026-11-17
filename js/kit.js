// kit.js — small building blocks shared by the files that build the room.
// Units are metres. x = left/right, y = up, z = towards the camera.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const ACCENT = '#5ee0c8';
export const FONT = 'Inter, system-ui, sans-serif';

// Where the big pieces of the room sit. Change a number here and everything that uses it moves.
export const LAYOUT = {
  PX: 1.3,                 // centre line of the wood panel, desk and monitor
  DESK_Y: 0.86,            // height of the desk surface
  DESK_W: 2.8,             // desk length
  SHELF_TOP: 2.66,
  SHELF_LOW: 1.94,
  WIN: { x: -2.75, y: 2.05, w: 2.1, h: 2.1 },   // window opening: centre, width, height
  PLAQUE_X: -1.02,          // education plaque and wall clock
  CABINET_X: 3.95,          // electrical cabinet on the right
  WALL_LEFT: -5.0,
  WALL_RIGHT: 5.7,
};

// ---- materials -----------------------------------------------------------------
export const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.0, ...extra });
export const metal = (color, rough = 0.35) => mat(color, { roughness: rough, metalness: 0.85 });
export const glow = (r, g, b) => new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b), toneMapped: false });
export const glass = (opacity = 0.12) => new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.04, metalness: 0, transparent: true, opacity, envMapIntensity: 0.9, depthWrite: false });

// ---- shapes ---------------------------------------------------------------------
export function shadow(mesh) { mesh.castShadow = true; mesh.receiveShadow = true; return mesh; }
export function box(w, h, d, material) { return shadow(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material)); }
export function rbox(w, h, d, material, r = 0.02) { return shadow(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, r), material)); }
export function cyl(rTop, rBottom, h, material, seg = 28) { return shadow(new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, seg), material)); }
export function ball(r, material, seg = 24) { return shadow(new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.66)), material)); }
export function torus(r, tubeR, material, seg = 48) { return shadow(new THREE.Mesh(new THREE.TorusGeometry(r, tubeR, 14, seg), material)); }
export function at(obj, x, y, z) { obj.position.set(x, y, z); return obj; }
export function rot(obj, x, y, z) { obj.rotation.set(x, y, z); return obj; }

// A bendy tube through a list of [x, y, z] points — used for cables, stems and lamp arms.
export function tube(points, radius, material, seg = 24) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  return shadow(new THREE.Mesh(new THREE.TubeGeometry(curve, seg, radius, 8), material));
}

// A straight rod between two points.
export function rod(a, b, radius, material) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const m = cyl(radius, radius, va.distanceTo(vb), material, 10);
  m.position.copy(va).add(vb).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
  return m;
}

// A plant leaf: a flat strip that is narrow at the stem, wide in the middle,
// pointed at the tip, slightly folded and drooping. It grows along +y from its base.
const leafCache = {};
export function leaf(len, wid, material, bend = 0.25) {
  const key = `${len.toFixed(2)}|${wid.toFixed(2)}|${bend.toFixed(2)}`;
  if (!leafCache[key]) {
    const geo = new THREE.PlaneGeometry(wid, len, 4, 7);
    geo.translate(0, len / 2, 0);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const v = Math.min(1, Math.max(0, p.getY(i) / len));
      const profile = Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(v, 0.7))), 0.8);
      const x = p.getX(i) * Math.max(0.04, profile);
      p.setX(i, x);
      p.setZ(i, Math.abs(x) * 0.35 - bend * len * v * v);
    }
    geo.computeVertexNormals();
    leafCache[key] = geo;
  }
  const m = new THREE.Mesh(leafCache[key], material);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

// ---- pictures drawn with code ---------------------------------------------------
export function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
export function canvasTexture(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
export function screen(w, h, texture) {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }));
}

// A tiny repeatable random-number generator, so things look the same on every visit.
export function seededRandom(seed) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
