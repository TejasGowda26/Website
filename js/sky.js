// sky.js — paints the view through the window.
// The colours follow the visitor's local clock: blue by day, orange at dusk,
// dark with lit windows at night. `hour` is a number from 0 to 24 (18.5 = 6:30 pm).

// A tiny repeatable random-number generator, so the skyline looks the same on every visit.
function seededRandom(seed) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hexToRgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const css = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;

// Sky colours at key times of day: [hour, top, middle, horizon, daylight 0..1]
const KEYS = [
  [0.0, '#060a18', '#0e1730', '#1a2444', 0.0],
  [4.8, '#060a18', '#0e1730', '#1a2444', 0.0],
  [6.2, '#2b3a6b', '#c9788a', '#f6b37a', 0.35],
  [8.0, '#3b7fd6', '#7fb4ee', '#cfe5f7', 1.0],
  [16.3, '#3b7fd6', '#7fb4ee', '#d8e6f2', 1.0],
  [18.0, '#2b2f5a', '#a8667d', '#f0a070', 0.45],
  [19.0, '#141838', '#3d3160', '#94546c', 0.15],
  [20.2, '#060a18', '#0e1730', '#1a2444', 0.0],
  [24.0, '#060a18', '#0e1730', '#1a2444', 0.0],
];

export function skyState(hour) {
  let i = 0;
  while (i < KEYS.length - 2 && hour >= KEYS[i + 1][0]) i++;
  const a = KEYS[i], b = KEYS[i + 1];
  const t = Math.min(1, Math.max(0, (hour - a[0]) / (b[0] - a[0])));
  return {
    top: mix(hexToRgb(a[1]), hexToRgb(b[1]), t),
    mid: mix(hexToRgb(a[2]), hexToRgb(b[2]), t),
    low: mix(hexToRgb(a[3]), hexToRgb(b[3]), t),
    daylight: a[4] + (b[4] - a[4]) * t,
  };
}

// opts.horizon: how far down the canvas the horizon sits (0 to 1).
// opts.skyline: false leaves the buildings out (the 3D city is drawn separately).
// opts.sunX: [from, to] across the canvas, so the sun and moon stay where the window can see them.
export function drawSky(canvas, hour, opts = {}) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const hz = opts.horizon ?? 0.86;
  const sunX = opts.sunX ?? [0.12, 0.88];
  const sunR = opts.sunRadius ?? 26;
  const s = skyState(hour);
  const night = 1 - Math.min(1, s.daylight * 2.2);

  // Sky gradient
  const g = ctx.createLinearGradient(0, 0, 0, H * hz);
  g.addColorStop(0, css(s.top));
  g.addColorStop(0.55, css(s.mid));
  g.addColorStop(1, css(s.low));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Stars
  const rs = seededRandom(7);
  if (night > 0.05) {
    ctx.fillStyle = `rgba(255,255,255,${0.85 * night})`;
    for (let i = 0; i < (opts.stars ?? 90); i++) {
      const x = rs() * W, y = rs() * H * hz * 0.92, r = rs() * 1.3 + 0.4;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Sun (day) or moon (night)
  const dayT = (hour - 6) / 12.6;
  if (dayT > -0.05 && dayT < 1.05) {
    const sx = W * (sunX[0] + (sunX[1] - sunX[0]) * dayT);
    const sy = H * (hz - 0.06) - Math.sin(Math.PI * Math.min(1, Math.max(0, dayT))) * H * hz * 0.8;
    const warm = mix([255, 244, 214], [255, 190, 120], 1 - s.daylight);
    const halo = ctx.createRadialGradient(sx, sy, 0, sx, sy, sunR * 4.2);
    halo.addColorStop(0, `rgba(${warm[0]},${warm[1]},${warm[2]},0.55)`);
    halo.addColorStop(1, `rgba(${warm[0]},${warm[1]},${warm[2]},0)`);
    ctx.fillStyle = halo; ctx.fillRect(sx - sunR * 4.2, sy - sunR * 4.2, sunR * 8.4, sunR * 8.4);
    ctx.fillStyle = css(warm);
    ctx.beginPath(); ctx.arc(sx, sy, sunR, 0, Math.PI * 2); ctx.fill();
  } else {
    const mx = W * (opts.moonX ?? 0.74), my = H * (opts.moonY ?? 0.2), mr = sunR * 0.78;
    ctx.fillStyle = 'rgba(232,236,246,0.92)';
    ctx.beginPath(); ctx.arc(mx, my, mr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = css(mix(s.top, s.mid, 0.5));
    ctx.beginPath(); ctx.arc(mx + mr * 0.45, my - mr * 0.25, mr * 0.9, 0, Math.PI * 2); ctx.fill();
  }

  if (opts.skyline === false) return s;

  // Far and near rows of buildings
  const rb = seededRandom(26);
  const rows = [
    { base: H * 0.9, minH: 0.2, maxH: 0.42, col: mix([28, 30, 52], [120, 138, 166], s.daylight * 0.85), lit: 0.5 },
    { base: H, minH: 0.14, maxH: 0.34, col: mix([16, 17, 30], [70, 82, 104], s.daylight * 0.8), lit: 0.75 },
  ];
  for (const row of rows) {
    let x = -10;
    while (x < W) {
      const bw = 26 + rb() * 46;
      const bh = H * (row.minH + rb() * (row.maxH - row.minH));
      const top = row.base - bh;
      ctx.fillStyle = css(row.col);
      ctx.fillRect(x, top, bw, bh + 4);
      if (rb() < 0.22) ctx.fillRect(x + bw / 2 - 1.5, top - 20, 3, 20); // antenna
      // Windows that light up as it gets dark
      if (night > 0.02) {
        for (let wy = top + 8; wy < row.base - 10; wy += 13) {
          for (let wx = x + 5; wx < x + bw - 7; wx += 10) {
            if (rb() < row.lit * 0.5) {
              ctx.fillStyle = `rgba(255,${200 + Math.floor(rb() * 40)},${120 + Math.floor(rb() * 50)},${night * 0.95})`;
              ctx.fillRect(wx, wy, 5, 6);
            }
          }
        }
      } else {
        // keep the random sequence in step whether or not windows are drawn
        for (let wy = top + 8; wy < row.base - 10; wy += 13) for (let wx = x + 5; wx < x + bw - 7; wx += 10) { if (rb() < row.lit * 0.5) { rb(); rb(); } }
      }
      x += bw + 3 + rb() * 10;
    }
  }

  // A line of trees along the bottom — Bengaluru is the "garden city"
  const rt = seededRandom(99);
  ctx.fillStyle = css(mix([10, 18, 16], [52, 92, 60], s.daylight * 0.8));
  for (let x = -10; x < W + 20; x += 22 + rt() * 14) {
    ctx.beginPath(); ctx.arc(x, H + 4, 20 + rt() * 14, 0, Math.PI * 2); ctx.fill();
  }
  return s;
}
