// sky.js — paints the sky seen through the window.
// The room is always shown in the same purple evening light: the sun has just
// set, the sky fades from deep indigo at the top through violet and pink to a
// warm peach glow on the horizon, and the first stars are coming out.

// A tiny repeatable random-number generator, so the stars land in the same place on every visit.
function seededRandom(seed) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The evening colours. Change these to restyle the whole view (and the light it
// casts into the room, which furniture.js takes from here too).
//   stops     sky gradient from the top of the picture (0) to the horizon (1)
//   window    colour of the light that comes in through the window
//   bounce    colour of the window light after it bounces off the floor
//   haze      colour of the distant haze between the buildings
export const EVENING = {
  stops: [[0.0, '#151236'], [0.28, '#2b2260'], [0.52, '#56398a'], [0.74, '#a1569b'], [0.9, '#df7f98'], [1.0, '#f5ab82']],
  window: '#b79ae4',
  bounce: '#9a74cf',
  haze: '#5a4683',
};

// opts.horizon: how far down the canvas the horizon sits (0 to 1).
// opts.top:     where the colour gradient begins (0 to 1); the window only sees a band near the horizon.
// opts.glowX:   where (0 to 1 across) the sun went down, so its glow sits behind the buildings.
// opts.moonX / opts.moonY: where the thin crescent moon is.
export function drawSky(canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const hz = opts.horizon ?? 0.86;
  const top = opts.top ?? 0;              // where the gradient starts; above it the sky is the darkest colour

  // gradient, extended below the horizon with the last colour
  const g = ctx.createLinearGradient(0, H * top, 0, H * hz);
  for (const [t, c] of EVENING.stops) g.addColorStop(t, c);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  // the glow where the sun went down
  const gx = W * (opts.glowX ?? 0.45), gy = H * hz;
  const glowR = ctx.createRadialGradient(gx, gy, 0, gx, gy, W * 0.32);
  glowR.addColorStop(0, 'rgba(255,196,140,0.85)');
  glowR.addColorStop(0.35, 'rgba(240,140,150,0.35)');
  glowR.addColorStop(1, 'rgba(200,110,170,0)');
  ctx.fillStyle = glowR; ctx.fillRect(0, 0, W, H);

  // the first stars, only in the darkest part at the top
  const rs = seededRandom(7);
  const s0 = H * top, s1 = H * (top + (hz - top) * 0.55);
  for (let i = 0; i < (opts.stars ?? 120); i++) {
    const x = rs() * W, y = s0 * 0.9 + rs() * (s1 - s0 * 0.9), r = rs() * 1.3 + 0.5;
    const fade = Math.max(0, Math.min(1, 1.2 - (y - s0) / (s1 - s0)));
    ctx.fillStyle = `rgba(255,240,255,${(0.25 + rs() * 0.55) * fade})`;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  // the evening star (Venus), a little brighter than the rest
  const vx = W * (opts.venusX ?? 0.5), vy = H * (opts.venusY ?? 0.5);
  const vg = ctx.createRadialGradient(vx, vy, 0, vx, vy, 9);
  vg.addColorStop(0, 'rgba(255,250,240,1)'); vg.addColorStop(1, 'rgba(255,250,240,0)');
  ctx.fillStyle = vg; ctx.fillRect(vx - 9, vy - 9, 18, 18);

  // a thin crescent moon
  const mx = W * (opts.moonX ?? 0.4), my = H * (opts.moonY ?? 0.3), mr = opts.moonRadius ?? 7;
  const mg = ctx.createRadialGradient(mx, my, 0, mx, my, mr * 4);
  mg.addColorStop(0, 'rgba(255,235,245,0.22)'); mg.addColorStop(1, 'rgba(255,235,245,0)');
  ctx.fillStyle = mg; ctx.fillRect(mx - mr * 4, my - mr * 4, mr * 8, mr * 8);
  const moon = document.createElement('canvas'); moon.width = moon.height = Math.ceil(mr * 2 + 2);
  const m = moon.getContext('2d'), c = moon.width / 2;
  m.fillStyle = 'rgba(255,240,235,0.95)'; m.beginPath(); m.arc(c, c, mr, 0, Math.PI * 2); m.fill();
  m.globalCompositeOperation = 'destination-out';          // bite out most of the disc to leave a crescent
  m.beginPath(); m.arc(c + mr * 0.55, c - mr * 0.3, mr * 0.95, 0, Math.PI * 2); m.fill();
  ctx.drawImage(moon, mx - c, my - c);
}
