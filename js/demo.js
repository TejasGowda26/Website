// demo.js — the small traffic-jam game shown on the monitor.
//
// It is a simplified, browser-sized cousin of the Traffic Jam Assist project:
//   * other cars follow each other with the "Intelligent Driver Model" (IDM),
//     a standard formula for how drivers speed up and brake in a queue
//   * a motorcycle filters between lanes
//   * the green car is yours. Its speed is automatic; you steer it.
//   * "assist" gently pulls the car back to the middle of its lane, and backs
//     off when you steer firmly — the idea behind shared steering control.
//
// Distances are in metres and speeds in metres per second.

const LANE_W = 3.5;                       // width of one lane
const LANES = [-LANE_W, 0, LANE_W];       // sideways position of each lane centre
const ROAD_HALF = LANE_W * 1.5;           // half the road width
const SCALE = 14;                         // pixels per metre
const EGO_SCREEN_X = 300;                 // where the green car sits on screen
const CAR_L = 4.4, CAR_W = 1.9;
const V_MAX = 8.3;                        // 30 km/h

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export class TrafficDemo {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.time = 0;
    this.driving = false;     // false = it drives itself, true = the visitor steers
    this.assist = true;
    this.steer = 0;           // smoothed steering, -1 (left) to 1 (right)
    this.torque = 0;          // how hard the assist is pushing, -1 to 1
    this.maxDrift = 0;
    this.collisions = 0;
    this.flash = 0;
    this.autoTarget = 1;      // lane the self-driving mode is aiming for
    this.autoTimer = 4;
    this.ego = { s: 0, y: 0, v: 5, vy: 0 };
    this.cars = [];
    const colours = ['#8c919c', '#b9bec8', '#6d727d', '#c98a3a', '#7f8fb5', '#a8adb8'];
    // Starting queue: a few cars in each lane, spaced out along the road.
    let n = 0;
    for (let lane = 0; lane < 3; lane++) {
      for (let k = 0; k < 4; k++) {
        const s = -34 + k * 26 + lane * 7 + (lane === 1 && k === 1 ? 12 : 0);
        if (lane === 1 && Math.abs(s) < 9) continue; // leave room for the green car
        this.cars.push({ s, lane, y: LANES[lane], v: 4 + lane, colour: colours[n++ % colours.length] });
      }
    }
    this.bike = { s: -30, y: LANE_W / 2, v: 9 };
  }

  setDriving(on) {
    this.driving = on;
    this.maxDrift = 0;
    this.collisions = 0;
  }

  // Which lane centre is closest to sideways position y?
  nearestLane(y) {
    let best = 0;
    for (let i = 1; i < 3; i++) if (Math.abs(y - LANES[i]) < Math.abs(y - LANES[best])) best = i;
    return best;
  }

  // IDM: acceleration for a car at speed v, wanting speed v0, with a gap to the car ahead.
  idm(v, v0, gap, leadV) {
    const aMax = 1.4, bComf = 2.0, s0 = 2.2, T = 1.1;
    const dv = v - leadV;
    const sStar = s0 + Math.max(0, v * T + (v * dv) / (2 * Math.sqrt(aMax * bComf)));
    return aMax * (1 - Math.pow(v / Math.max(0.1, v0), 4) - Math.pow(sStar / Math.max(0.5, gap), 2));
  }

  // Find the nearest vehicle ahead of position s that overlaps sideways position y.
  leaderFor(s, y, self) {
    let best = null, bestGap = Infinity;
    const all = self === this.ego ? this.cars : [...this.cars, this.ego];
    for (const c of all) {
      if (c === self) continue;
      if (Math.abs(c.y - y) > 2.3) continue;
      const gap = c.s - s - CAR_L;
      if (c.s > s && gap < bestGap) { bestGap = gap; best = c; }
    }
    return { lead: best, gap: bestGap };
  }

  update(dt, input) {
    dt = Math.min(dt, 0.05);
    this.time += dt;
    const t = this.time, ego = this.ego;

    // --- other cars -------------------------------------------------------
    for (const c of this.cars) {
      // each lane's flow speeds up and slows down in waves, like a real jam
      const v0 = V_MAX * (0.5 + 0.45 * Math.sin(t * 0.13 + c.lane * 2.1));
      const { lead, gap } = this.leaderFor(c.s, c.y, c);
      const a = this.idm(c.v, Math.max(1.2, v0), lead ? gap : 200, lead ? lead.v : c.v);
      c.v = clamp(c.v + a * dt, 0, V_MAX);
      c.s += c.v * dt;
    }
    // recycle cars that leave the screen so the road never empties
    for (const c of this.cars) {
      const rel = c.s - ego.s;
      if (rel < -46 || rel > 86) {
        const ahead = rel < 0;
        const lane = Math.floor(Math.random() * 3);
        const s = ego.s + (ahead ? 70 + Math.random() * 12 : -42);
        const clear = this.cars.every((o) => o === c || o.lane !== lane || Math.abs(o.s - s) > 9);
        if (clear) { c.lane = lane; c.y = LANES[lane]; c.s = s; c.v = ahead ? 3 : ego.v + 1; }
        else if (rel < -60 || rel > 100) { c.s = ego.s + (ahead ? 95 : -58); }
      }
    }

    // --- motorcycle filtering between lanes -------------------------------
    const b = this.bike;
    b.s += b.v * dt;
    b.v = clamp(ego.v + 3.2, 3, 11);
    if (b.s - ego.s > 70) { b.s = ego.s - 30 - Math.random() * 40; b.y = (Math.random() < 0.5 ? -1 : 1) * LANE_W / 2; }

    // --- the green car: speed is automatic ---------------------------------
    const { lead, gap } = this.leaderFor(ego.s, ego.y, ego);
    const aEgo = this.idm(ego.v, V_MAX, lead ? gap : 200, lead ? lead.v : ego.v);
    ego.v = clamp(ego.v + aEgo * dt, 0, V_MAX);
    ego.s += ego.v * dt;
    this.ttc = lead && ego.v > lead.v + 0.1 ? gap / (ego.v - lead.v) : Infinity;

    // --- the green car: steering -------------------------------------------
    let want = 0;         // what the driver asks for, -1..1
    let lane = this.nearestLane(ego.y);
    if (this.driving) {
      want = input || 0;
      // an inattentive driver lets the car wander when not steering
      if (Math.abs(want) < 0.05) want = 0.125 * Math.sin(t * 0.55) + 0.08 * Math.sin(t * 1.31 + 1);
    } else {
      // self-driving: now and then, move to a neighbouring lane if it has more room
      this.autoTimer -= dt;
      if (this.autoTimer < 0) {
        this.autoTimer = 5 + Math.random() * 4;
        const options = [lane - 1, lane + 1].filter((l) => l >= 0 && l < 3);
        const pick = options[Math.floor(Math.random() * options.length)];
        const free = this.cars.every((c) => c.lane !== pick || c.s - ego.s > 13 || c.s - ego.s < -9);
        const blocked = gap < 14;
        if (free && blocked) this.autoTarget = pick;
        else this.autoTarget = lane;
      }
      lane = this.autoTarget;
    }
    this.steer += (want - this.steer) * Math.min(1, dt * 8);

    // assist: a spring pulling towards the lane centre, weaker while the driver steers firmly
    const err = ego.y - LANES[lane];
    let authority = 0;
    if (!this.driving) authority = 1;
    else if (this.assist) authority = Math.abs(input || 0) > 0.4 ? 0.12 : 1;
    this.torque = clamp((-err * 1.5 - ego.vy * 0.9) * authority, -1, 1);

    const speedFactor = 0.45 + 0.55 * (ego.v / V_MAX);
    const targetVy = (this.steer * 3.1 + this.torque * 1.9) * speedFactor;
    ego.vy += (targetVy - ego.vy) * Math.min(1, dt * 6);
    ego.y = clamp(ego.y + ego.vy * dt, -ROAD_HALF + CAR_W / 2, ROAD_HALF - CAR_W / 2);

    // --- scoring ------------------------------------------------------------
    const drift = Math.abs(ego.y - LANES[this.nearestLane(ego.y)]);
    this.drift = drift;
    // only score the drift once the driver has been hands-off for a moment
    this.handsOff = Math.abs(input || 0) > 0.05 ? 0 : (this.handsOff || 0) + dt;
    if (this.driving && this.handsOff > 2) this.maxDrift = Math.max(this.maxDrift, drift);
    this.flash = Math.max(0, this.flash - dt);
    for (const c of this.cars) {
      if (Math.abs(c.s - ego.s) < CAR_L - 0.2 && Math.abs(c.y - ego.y) < CAR_W - 0.15 && this.flash <= 0) {
        this.collisions++;
        this.flash = 1.2;
        c.s += (c.s > ego.s ? 9 : -9);
        ego.vy = 0;
      }
    }
  }

  // ---------------------------------------------------------------------------
  drawCar(x, y, len, wid, colour, isEgo) {
    const ctx = this.ctx;
    const L = len * SCALE, Wd = wid * SCALE;
    ctx.save();
    ctx.translate(x, y);
    if (isEgo) ctx.rotate(clamp(this.ego.vy * 0.06, -0.2, 0.2));
    ctx.fillStyle = colour;
    ctx.beginPath(); ctx.roundRect(-L / 2, -Wd / 2, L, Wd, 6); ctx.fill();
    ctx.fillStyle = 'rgba(12,14,20,0.75)';
    ctx.beginPath(); ctx.roundRect(L * 0.05, -Wd / 2 + 3, L * 0.2, Wd - 6, 3); ctx.fill();   // windscreen
    ctx.beginPath(); ctx.roundRect(-L * 0.36, -Wd / 2 + 3, L * 0.12, Wd - 6, 3); ctx.fill(); // rear window
    if (isEgo) {
      ctx.strokeStyle = 'rgba(94,224,200,0.55)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(-L / 2 - 5, -Wd / 2 - 5, L + 10, Wd + 10, 10); ctx.stroke();
    }
    ctx.restore();
  }

  draw() {
    const ctx = this.ctx, W = this.canvas.width, H = this.canvas.height;
    const ego = this.ego, cy = H / 2 + 8;
    const sx = (s) => EGO_SCREEN_X + (s - ego.s) * SCALE;
    const sy = (y) => cy + y * SCALE;

    ctx.fillStyle = '#0d1016'; ctx.fillRect(0, 0, W, H);
    // road
    ctx.fillStyle = '#232730';
    ctx.fillRect(0, sy(-ROAD_HALF), W, ROAD_HALF * 2 * SCALE);
    ctx.fillStyle = '#e8eaf0';
    ctx.fillRect(0, sy(-ROAD_HALF) - 3, W, 3);
    ctx.fillRect(0, sy(ROAD_HALF), W, 3);
    // dashed lane lines scroll with the car's speed
    const dash = 3 * SCALE, period = 7.5 * SCALE;
    const offset = ((ego.s * SCALE) % period + period) % period;
    for (const yl of [-LANE_W / 2, LANE_W / 2]) {
      for (let x = -offset; x < W; x += period) ctx.fillRect(x, sy(yl) - 1.5, dash, 3);
    }

    // predicted path of the green car
    ctx.strokeStyle = 'rgba(94,224,200,0.7)'; ctx.lineWidth = 3; ctx.setLineDash([6, 8]);
    ctx.beginPath(); ctx.moveTo(sx(ego.s) + 36, sy(ego.y));
    ctx.quadraticCurveTo(sx(ego.s) + 110, sy(ego.y + ego.vy * 0.6), sx(ego.s) + 190, sy(ego.y + ego.vy * 1.6));
    ctx.stroke(); ctx.setLineDash([]);

    for (const c of this.cars) {
      const x = sx(c.s);
      if (x > -60 && x < W + 60) this.drawCar(x, sy(c.y), CAR_L, CAR_W, c.colour, false);
    }
    // motorcycle
    const bx = sx(this.bike.s);
    if (bx > -40 && bx < W + 40) {
      ctx.fillStyle = '#f0a070';
      ctx.beginPath(); ctx.roundRect(bx - 15, sy(this.bike.y) - 5, 30, 10, 5); ctx.fill();
      ctx.fillStyle = '#1b1e27';
      ctx.beginPath(); ctx.arc(bx - 2, sy(this.bike.y), 4.5, 0, Math.PI * 2); ctx.fill();
    }
    this.drawCar(sx(ego.s), sy(ego.y), CAR_L, CAR_W, '#5ee0c8', true);

    // arrow showing which way the assist is pushing
    if (Math.abs(this.torque) > 0.08) {
      const ax = sx(ego.s), ay = sy(ego.y), dir = Math.sign(this.torque), len = 10 + Math.abs(this.torque) * 26;
      ctx.strokeStyle = '#ffb765'; ctx.fillStyle = '#ffb765'; ctx.lineWidth = 4;
      const y0 = ay + dir * 22, y1 = y0 + dir * len;
      ctx.beginPath(); ctx.moveTo(ax, y0); ctx.lineTo(ax, y1); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ax - 8, y1); ctx.lineTo(ax + 8, y1); ctx.lineTo(ax, y1 + dir * 10); ctx.closePath(); ctx.fill();
    }

    // --- text read-outs -----------------------------------------------------
    const font = (px, w = 600) => `${w} ${px}px Inter, system-ui, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#5ee0c8'; ctx.font = font(20, 700); ctx.textAlign = 'left';
    ctx.fillText('TRAFFIC JAM ASSIST', 24, 30);
    ctx.fillStyle = '#9aa0ad'; ctx.font = font(16, 500);
    ctx.fillText('Level 2 · 0–30 km/h · browser demo', 250, 31);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#f2f4f8'; ctx.font = font(30, 700);
    ctx.fillText(`${Math.round(ego.v * 3.6)}`, W - 78, 30);
    ctx.fillStyle = '#9aa0ad'; ctx.font = font(16, 500);
    ctx.fillText('km/h', W - 24, 32);

    const by = H - 28;
    ctx.textAlign = 'left'; ctx.font = font(17, 600);
    if (!this.driving) {
      ctx.fillStyle = '#c5cad3';
      ctx.fillText('Self-driving preview — take the wheel to steer it yourself', 24, by);
    } else {
      ctx.fillStyle = this.assist ? '#5ee0c8' : '#f0a070';
      ctx.fillText(this.assist ? 'ASSIST ON' : 'ASSIST OFF', 24, by);
      ctx.fillStyle = '#c5cad3'; ctx.font = font(17, 500);
      ctx.fillText(`Lane drift ${this.drift.toFixed(2)} m   ·   worst hands-off ${this.maxDrift.toFixed(2)} m   ·   bumps ${this.collisions}`, 150, by);
    }
    // time-to-collision bar
    ctx.textAlign = 'right'; ctx.fillStyle = '#9aa0ad'; ctx.font = font(15, 500);
    ctx.fillText('Gap to car ahead', W - 150, by);
    const ttc = Math.min(8, this.ttc ?? 8), frac = isFinite(ttc) ? ttc / 8 : 1;
    ctx.fillStyle = '#2b2f3a'; ctx.fillRect(W - 138, by - 6, 114, 12);
    ctx.fillStyle = frac < 0.3 ? '#e2685a' : frac < 0.55 ? '#ffb765' : '#5ee0c8';
    ctx.fillRect(W - 138, by - 6, 114 * frac, 12);

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(226,104,90,${0.35 * Math.min(1, this.flash)})`;
      ctx.fillRect(0, 0, W, H);
    }
  }
}
