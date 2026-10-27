/* Visual band for teacherslens.com
   An animated strip under the fixed menu. Each page load shows a different visualization.
   Load with: <script src="bokeh-band.js" defer></script>
   Preview a specific one: teacherslens.com/?band=bokeh, ?band=hexagons, ?band=lights or ?band=diatoms
   Optional: add data-bokeh-anchor to the menu element to pin the band under it. */
(() => {
  const S = {
    // Shared
    BAND_HEIGHT: 53,          // band height in px
    FEATHER: 0.85,            // share of the band that fades, 0–1
    BAND_OPACITY: null,       // null = match the menu; or 0–1
    BAND_BLUR: null,          // null = match the menu; or e.g. 'blur(8px)'
    SCROLL_SENSITIVITY: 1000, // scroll speed (px/s) that counts as full energy
    SCROLL_RESPONSE: 150,     // ms to react when scrolling starts
    SCROLL_BUILDUP: 2500,     // ms of continuous scrolling to reach full momentum
    SCROLL_SETTLE: 3500,      // ms to glide back to rest after scrolling stops
    // Bokeh
    FILL_SOFTNESS: 2.2,       // blur on the glow, in px
    RIM_SHARPNESS: 0.55,      // crisp rim strength (0–1)
    TEXT_GLOW: 0.5,           // how much content brightens the balls (0–1)
    REST_BALLS: 8,            // balls present when not scrolling
    REST_SPEED: 0.15,         // movement when not scrolling
    SCROLL_SPEEDUP: 12,       // speed multiple at full momentum
    SCROLL_EXTRA: 45,         // extra balls at full momentum
    // Hexagons
    HEX_SIZE: null,           // hexagon radius in px; null = fit two full rows in the band
    HEX_BRIGHTNESS: 1,        // pencil brightness multiplier
    // Colored lights
    LIGHTS_DENSITY: 1,        // number of lights (1 = default)
    LIGHTS_SPEEDUP: 6,        // speed multiple at full momentum
    LIGHTS_EXTRA: 25,         // extra lights at full momentum
    // Full screen
    FULLSCREEN_BUTTON: true   // small button at the right end of the band
  };

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp01 = v => Math.max(0, Math.min(1, v));
  const nums = c => (c.match(/[\d.]+/g) || []).map(Number);
  const isClear = c => !c || c === 'transparent' || c === 'rgba(0, 0, 0, 0)';

  /* ================= Bokeh ================= */
  function bokehBand(stage) {
    const cd = stage.canvas(`filter:blur(${S.FILL_SOFTNESS}px);mix-blend-mode:color-dodge`);
    const cf = stage.canvas(`filter:blur(${S.FILL_SOFTNESS}px);mix-blend-mode:plus-lighter`);
    const cr = stage.canvas('mix-blend-mode:plus-lighter');
    const xd = cd.getContext('2d'), xf = cf.getContext('2d'), xr = cr.getContext('2d');
    const layers = [[cd, xd], [cf, xf], [cr, xr]];
    let balls = [], nextSpawn = 0, nextSurge = 0, W = 0, H = 0, clock = 0, seeded = false, level = 0, full = false, scale = 1;

    const life = () => Math.random() < .4 ? 2500 + Math.random() * 3500 : 9000 + Math.random() * 18000;
    const speed = () => { const q = Math.random(); return q < .6 ? 1.5 + Math.random() * 4 : q < .9 ? 5 + Math.random() * 6 : 12 + Math.random() * 10; };
    const one = (x, y, h, v, delay, surge) => balls.push({ x, y, h, v, surge, born: clock + delay, life: life(), a: .15 + Math.random() * .11 });
    function spawn(surge = false) {
      const unit = Math.max(36, Math.min(110, H / 9));
      const h = full ? unit * (.6 + Math.random() * .8) : H * (.27 + Math.random() * .15);
      const y = h + 3 + Math.random() * Math.max(0, H - 2 * h - 6), x = Math.random() * W * 1.08;
      if (surge && Math.random() < .22) { const n = 3 + Math.floor(Math.random() * 3), v = speed(); for (let k = 0; k < n; k++) one(x + k * h * (.5 + Math.random() * .3), y, h, v, k * 60, true); }
      else one(x, y, h, speed(), 0, surge);
    }
    function lens(x, cx, cy, h, w) {
      x.beginPath();
      if (w >= h - .01) { x.arc(cx, cy, h, 0, Math.PI * 2); return; }
      const c = (h * h - w * w) / (2 * w), R = c + w, th = Math.atan2(h, c);
      x.arc(cx - c, cy, R, -th, th); x.arc(cx + c, cy, R, Math.PI - th, Math.PI + th); x.closePath();
    }
    function draw() {
      for (const [, x] of layers) { x.clearRect(0, 0, W, H); x.globalCompositeOperation = 'lighter'; }
      for (const b of balls) {
        const age = clock - b.born; if (age < 0) continue;
        let f = Math.max(0, Math.min(1, age / (b.surge ? 350 : 1400), (b.life - age) / 1600));
        if (b.surge) f *= Math.min(1, level * 2);
        const p = Math.max(0, Math.min(1, b.x / W)), e = Math.abs(2 * p - 1), w = b.h * (1 - .55 * e * e), a = b.a * f;
        if (a < .002) continue;
        lens(xd, b.x, b.y, b.h, w); xd.fillStyle = `rgba(245,230,205,${Math.min(.9, a * 2.2 * S.TEXT_GLOW)})`; xd.fill();
        lens(xf, b.x, b.y, b.h, w); xf.fillStyle = `rgba(245,230,205,${a})`; xf.fill();
        xf.lineWidth = 2; xf.strokeStyle = `rgba(255,244,225,${a * .9})`; xf.stroke();
        lens(xr, b.x, b.y, b.h - .5, w - .5); xr.lineWidth = .9; xr.strokeStyle = `rgba(255,246,230,${a * 1.6 * S.RIM_SHARPNESS})`; xr.stroke();
      }
    }
    return {
      resize(w, h, dpr, isFull) {
        if (isFull !== full) { balls = []; seeded = false; }
        W = w; H = h; full = isFull;
        scale = full ? Math.max(1, H / 53 * 0.5) : 1;
        const soft = S.FILL_SOFTNESS * (full ? 2 : 1);
        cd.style.filter = cf.style.filter = `blur(${soft}px)`;
        for (const [c, x] of layers) { c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); }
      },
      step(dt, lv) {
        level = lv; clock += dt;
        const restN = Math.round(S.REST_BALLS * scale), extraN = S.SCROLL_EXTRA * scale, spd = full ? 3 : 1;
        if (!seeded) { seeded = true; for (let k = 0; k < restN; k++) { spawn(); balls[balls.length - 1].born -= 1400 + Math.random() * 4000; } }
        const base = balls.filter(b => !b.surge).length, surge = balls.length - base;
        if (clock > nextSpawn && base < restN) { spawn(); nextSpawn = clock + (800 + Math.random() * 2000) / scale; }
        if (level > .03 && clock > nextSurge && surge < level * extraN) { spawn(true); nextSurge = clock + (30 + Math.random() * 120) / (.3 + level) / scale; }
        const mult = (S.REST_SPEED + level * (S.SCROLL_SPEEDUP - S.REST_SPEED)) * spd;
        balls.forEach(b => b.x -= b.v * mult * dt / 1000);
        balls = balls.filter(b => b.x > -b.h * 2 && clock - b.born < b.life && !(b.surge && level < .01));
        draw();
      }
    };
  }

  /* ================= Sketched hexagons ================= */
  function hexBand(stage) {
    const cv = stage.canvas('mix-blend-mode:screen');
    const ctx = cv.getContext('2d');
    const INK = '238,234,224';
    let R = 15, HW = 0, ROW = 0, s = 0, top = 0, full = false, k = 1;
    const easeIO = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const smooth = t => t * t * (3 - 2 * t);
    const V = [];

    let W = 0, H = 0, dpr = 1, grid = [], visible = [], t = 0, nextSpawn = 0.3, maxPencils = 6, started = false;
    const dust = [];

    function build() {
      // Two complete rows: total height of two interlocking pointy-top rows is 3.5 × radius
      const margin = 2.5;
      R = full ? Math.max(30, H / 16) : S.HEX_SIZE ?? Math.max(8, (H - 2 * margin) / 3.5);
      k = full ? Math.max(1, R / 28) : 1;   // detail scale: line weight, hatch spacing
      HW = Math.sqrt(3) * R; ROW = 1.5 * R; s = R / 66;
      top = full ? -ROW / 2 - R : (H - 3.5 * R) / 2;
      V.length = 0;
      for (let i = 0; i < 6; i++) { const a = (-90 + 60 * i) * Math.PI / 180; V.push([R * Math.cos(a), R * Math.sin(a)]); }
      grid = [];
      const all = [];
      const rows = full ? Math.ceil(H / ROW) + 2 : 2, cols = Math.ceil(W / HW) + 2;
      for (let r = 0; r < rows; r++) {
        grid[r] = [];
        for (let q = 0; q < cols; q++) {
          const cell = { r, q, cx: q * HW + (r & 1 ? HW / 2 : 0) - HW / 2, cy: top + R + r * ROW, state: 'empty', div: 0 };
          grid[r][q] = cell; all.push(cell);
        }
      }
      visible = all.filter(onScreen);
      maxPencils = Math.max(4, Math.round(visible.length / 14));
    }
    function onScreen(c) { return c.cx > -HW * 0.3 && c.cx < W + HW * 0.3 && c.cy > -R * 0.6 && c.cy < H + R * 0.6; }
    function neighbors(c) {
      const d = (c.r & 1) ? [[0,-1],[0,1],[-1,0],[-1,1],[1,0],[1,1]] : [[0,-1],[0,1],[-1,-1],[-1,0],[1,-1],[1,0]];
      const out = [];
      for (const [dr, dq] of d) { const row = grid[c.r + dr]; if (row && row[c.q + dq]) out.push(row[c.q + dq]); }
      return out;
    }
    function faces(div) {
      const C = [0, 0];
      return div === 0
        ? [[C, V[5], V[0], V[1]], [C, V[1], V[2], V[3]], [C, V[3], V[4], V[5]]]
        : [[C, V[0], V[1], V[2]], [C, V[2], V[3], V[4]], [C, V[4], V[5], V[0]]];
    }
    function toneOf(poly) {
      const dirs = new Set();
      for (let i = 0; i < 2; i++) {
        const a = poly[i], b = poly[i + 1];
        let ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
        ang = ((ang % 180) + 180) % 180;
        dirs.add([30, 90, 150].reduce((p, c) => Math.abs(c - ang) < Math.abs(p - ang) ? c : p));
      }
      if (!dirs.has(90)) return 'light';
      if (!dirs.has(150)) return 'mid';
      return 'dark';
    }
    const HATCH = {
      light: [{ ang: 150, gap: 5, alpha: 0.24 }],
      mid:   [{ ang: 90,  gap: 2.6, alpha: 0.44 }],
      dark:  [{ ang: 150, gap: 2.2, alpha: 0.5 }, { ang: 90, gap: 2.6, alpha: 0.42 }, { ang: 30, gap: 4, alpha: 0.28 }]
    };
    function hatchSegments(poly, angDeg, gap) {
      const a = (angDeg + rand(-2, 2)) * Math.PI / 180;
      const d = [Math.cos(a), Math.sin(a)], n = [-d[1], d[0]];
      const proj = poly.map(p => p[0] * n[0] + p[1] * n[1]);
      const lo = Math.min(...proj), hi = Math.max(...proj);
      const segs = [];
      for (let q = lo + rand(0.3, 1) * gap; q < hi - 0.4; q += gap * rand(0.85, 1.15)) {
        const o = [n[0] * q, n[1] * q];
        let tmin = Infinity, tmax = -Infinity;
        for (let i = 0; i < poly.length; i++) {
          const p = poly[i], r = poly[(i + 1) % poly.length];
          const e = [r[0] - p[0], r[1] - p[1]];
          const den = d[0] * e[1] - d[1] * e[0];
          if (Math.abs(den) < 1e-6) continue;
          const w = [p[0] - o[0], p[1] - o[1]];
          const tt = (w[0] * e[1] - w[1] * e[0]) / den;
          const u = (w[0] * d[1] - w[1] * d[0]) / den;
          if (u >= -1e-6 && u <= 1 + 1e-6) { tmin = Math.min(tmin, tt); tmax = Math.max(tmax, tt); }
        }
        if (tmax - tmin < 1.5) continue;
        const t0 = tmin + rand(-0.3, 1), t1 = tmax - rand(-0.3, 1);
        if (Math.random() < 0.06) continue;
        segs.push([[o[0] + d[0] * t0, o[1] + d[1] * t0], [o[0] + d[0] * t1, o[1] + d[1] * t1]]);
      }
      return segs;
    }
    function makeStroke(a, b, o) {
      const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
      const os = (o.overshoot || 0) * k;
      const A = [a[0] - ux * rand(0, os), a[1] - uy * rand(0, os)];
      const B = [b[0] + ux * rand(0, os), b[1] + uy * rand(0, os)];
      const bow = rand(-1, 1) * (o.bow || 0) * len / 60;
      const pts = [], N = Math.max(2, Math.ceil(len / 4));
      for (let i = 0; i <= N; i++) {
        const tt = i / N, sb = Math.sin(Math.PI * tt) * bow;
        pts.push([A[0] + (B[0] - A[0]) * tt - uy * sb + rand(-0.15, 0.15), A[1] + (B[1] - A[1]) * tt + ux * sb + rand(-0.15, 0.15)]);
      }
      const cum = [0];
      for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      const L = cum[cum.length - 1];
      return { pts, cum, len: L, width: o.width * k, alpha: o.alpha * S.HEX_BRIGHTNESS, gaps: o.gaps || 0, delay: o.delay, dur: Math.max(0.05, L / (o.speed * s * 1.2)) };
    }
    function pointAt(st, l) {
      const { pts, cum } = st;
      let i = 1;
      while (i < cum.length - 1 && cum[i] < l) i++;
      const seg = cum[i] - cum[i - 1] || 1, u = clamp01((l - cum[i - 1]) / seg);
      return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u];
    }
    function planStrokes(cell) {
      const L = [];
      for (let k = 0; k < (Math.random() < 0.6 ? 1 : 2); k++) {
        const i = Math.floor(Math.random() * 6), a = V[i], b = V[(i + 1) % 6], ext = rand(0.25, 0.7);
        L.push(makeStroke([a[0] - (b[0] - a[0]) * ext, a[1] - (b[1] - a[1]) * ext], [b[0] + (b[0] - a[0]) * ext, b[1] + (b[1] - a[1]) * ext],
          { width: 0.45, alpha: 0.18, speed: 900, delay: rand(0.05, 0.2) }));
      }
      const start = Math.floor(Math.random() * 6);
      for (let k = 0; k < 6; k++) {
        const i = (start + k) % 6;
        L.push(makeStroke(V[i], V[(i + 1) % 6], { width: 0.95, alpha: 0.85, speed: rand(340, 460), overshoot: 1.3, bow: 1.4, delay: rand(0.06, 0.22) }));
      }
      for (let k = 0; k < 2; k++) {
        const i = Math.floor(Math.random() * 6);
        L.push(makeStroke(V[i], V[(i + 1) % 6], { width: 0.6, alpha: 0.38, speed: 520, overshoot: 1, bow: 2, delay: rand(0.05, 0.15) }));
      }
      const spokes = cell.div === 0 ? [1, 3, 5] : [0, 2, 4];
      spokes.sort(() => Math.random() - 0.5);
      for (const i of spokes) L.push(makeStroke([0, 0], V[i], { width: 0.75, alpha: 0.75, speed: rand(320, 420), overshoot: 0.8, bow: 1, delay: rand(0.12, 0.3) }));
      const fs = faces(cell.div).sort(() => Math.random() - 0.5);
      for (const poly of fs) {
        HATCH[toneOf(poly)].forEach(h => {
          const segs = hatchSegments(poly, h.ang, h.gap * k);
          if (Math.random() < 0.5) segs.reverse();
          segs.forEach((sg, j) => L.push(makeStroke(sg[0], sg[1], {
            width: rand(0.42, 0.6), alpha: h.alpha * rand(0.8, 1.15), speed: rand(650, 950), bow: 0.6, gaps: 0.05,
            delay: j === 0 ? rand(0.25, 0.5) : rand(0.025, 0.07)
          })));
        });
      }
      return L;
    }
    function startCell(cell) {
      const PAD = 5 * k;
      const bw = HW + 2 * PAD + 8, bh = 2 * R + 2 * PAD + 8;
      const c = document.createElement('canvas');
      c.width = Math.ceil(bw * dpr); c.height = Math.ceil(bh * dpr);
      const g = c.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, bw * dpr / 2, bh * dpr / 2);
      g.lineCap = 'round';
      Object.assign(cell, { state: 'drawing', cv: c, g, bw, bh, strokes: planStrokes(cell), si: 0, st: 0, drawn: 0, alpha: 1 });
    }
    function drawPiece(g, st, l0, l1) {
      const step = 1.2 * k;
      for (let l = l0; l < l1; l += step) {
        if (st.gaps && Math.random() < st.gaps) continue;
        const lb = Math.min(l + step, l1), p = pointAt(st, l), q = pointAt(st, lb);
        const press = 0.55 + 0.45 * Math.sin(Math.PI * clamp01((l + lb) / 2 / st.len));
        g.strokeStyle = `rgba(${INK},${(st.alpha * press * rand(0.7, 1.1)).toFixed(3)})`;
        g.lineWidth = st.width * rand(0.85, 1.15);
        g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke();
      }
    }
    function advanceDrawing(cell, dt) {
      cell.st += dt;
      while (cell.si < cell.strokes.length) {
        const st = cell.strokes[cell.si];
        if (cell.st < st.delay) return;
        const u = clamp01((cell.st - st.delay) / st.dur), target = easeIO(u) * st.len;
        if (target > cell.drawn) { drawPiece(cell.g, st, cell.drawn, target); cell.drawn = target; }
        if (u < 1) return;
        cell.st -= st.delay + st.dur; cell.drawn = 0; cell.si++;
      }
      cell.state = 'hold'; cell.holdUntil = t + rand(14, 32); cell.strokes = null;
    }
    function advanceErasing(cell, dt) {
      const p = clamp01((t - cell.eraseStart) / cell.eraseDur), g = cell.g;
      g.save(); g.globalCompositeOperation = 'destination-out';
      const marks = Math.ceil((3 + 26 * p) * dt * 10);
      for (let i = 0; i < marks; i++) {
        const x = rand(-HW / 2 - 2, HW / 2 + 2), y = rand(-R - 2, R + 2);
        g.strokeStyle = `rgba(0,0,0,${rand(0.25, 0.8)})`; g.lineWidth = rand(0.8, 2.6) * k; g.lineCap = 'round';
        g.beginPath(); g.moveTo(x, y);
        g.quadraticCurveTo(x + rand(-3, 3) * k, y + rand(-3, 3) * k, x + rand(-5, 5) * k, y + rand(-5, 5) * k); g.stroke();
        if (Math.random() < 0.12) dust.push({ x: cell.cx + x, y: cell.cy + y, vx: rand(-2, 2) * k, vy: rand(1, 5) * k, born: t, life: rand(1.2, 2.8), size: rand(0.4, 1) * k, a: rand(0.25, 0.6) });
      }
      g.restore();
      cell.alpha = 1 - smooth(p) * 0.9;
      if (p >= 1) { cell.state = 'empty'; cell.cv = cell.g = null; }
    }
    function spawnOne() {
      const live = visible.filter(c => c.state === 'drawing' || c.state === 'hold');
      let pick = null;
      if (live.length && Math.random() < 0.8) {
        const frontier = [];
        for (const c of live) for (const n of neighbors(c)) if (n.state === 'empty' && onScreen(n)) frontier.push([n, c]);
        if (frontier.length) { const [n, parent] = frontier[Math.floor(Math.random() * frontier.length)]; pick = n; n.div = Math.random() < 0.55 ? parent.div : Math.round(Math.random()); }
      }
      if (!pick) {
        const empty = visible.filter(c => c.state === 'empty');
        if (!empty.length) return null;
        pick = empty[Math.floor(Math.random() * empty.length)]; pick.div = Math.round(Math.random());
      }
      startCell(pick);
      return pick;
    }
    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (const c of visible) { if (!c.cv) continue; ctx.globalAlpha = c.alpha; ctx.drawImage(c.cv, c.cx - c.bw / 2, c.cy - c.bh / 2, c.bw, c.bh); }
      ctx.globalCompositeOperation = 'source-over';
      for (let i = dust.length - 1; i >= 0; i--) {
        const d = dust[i], age = t - d.born;
        if (age > d.life) { dust.splice(i, 1); continue; }
        ctx.globalAlpha = d.a * (1 - age / d.life); ctx.fillStyle = `rgb(${INK})`; ctx.fillRect(d.x, d.y, d.size, d.size);
      }
      ctx.globalAlpha = 1;
    }
    return {
      resize(w, h, d, isFull) {
        const rebuild = w !== W || h !== H || d !== dpr || isFull !== full;
        W = w; H = h; dpr = d; full = isFull;
        cv.width = W * dpr; cv.height = H * dpr;
        if (rebuild) { build(); dust.length = 0; started = false; }
      },
      step(dtMs, level, still) {
        const dt = Math.min(0.1, dtMs / 1000) * (1 + level * 1.5);
        if (still && !started) {
          // Reduced motion: a finished drawing, no animation
          started = true;
          for (let i = 0; i < visible.length * 0.4; i++) { const c = spawnOne(); if (c) advanceDrawing(c, 1e6); }
          draw(); return;
        }
        if (!started) {
          // Start with a few finished clusters so the band isn't empty on arrival
          for (let i = 0; i < visible.length * 0.18; i++) { const c = spawnOne(); if (c) { advanceDrawing(c, 1e6); c.holdUntil = rand(3, 24); } }
        }
        started = true;
        t += dt;
        for (const d of dust) { d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 2 * k * dt; }
        const target = visible.length * (0.33 + 0.14 * Math.sin(t * 2 * Math.PI / 80));
        let occupied = 0, pencils = 0;
        for (const c of visible) { if (c.state !== 'empty') occupied++; if (c.state === 'drawing') pencils++; }
        if (t >= nextSpawn && pencils < maxPencils * (1 + level) && occupied < target) { spawnOne(); nextSpawn = t + rand(0.12, 0.55); }
        for (const c of visible) {
          if (c.state === 'drawing') advanceDrawing(c, dt);
          else if (c.state === 'hold' && t >= c.holdUntil) { c.state = 'erasing'; c.eraseStart = t; c.eraseDur = rand(4, 7.5); }
          else if (c.state === 'erasing') advanceErasing(c, dt);
        }
        draw();
      }
    };
  }

  /* ================= Colored lights ================= */
  function lightsBand(stage) {
    const cv = stage.canvas('mix-blend-mode:plus-lighter');
    const ctx = cv.getContext('2d');
    const PALETTE = [
      [255, 168, 64], [255, 86, 120], [214, 72, 255], [64, 120, 255],
      [48, 210, 255], [60, 255, 170], [255, 220, 110], [255, 110, 60]
    ];
    const smooth = t => t * t * (3 - 2 * t);
    // Disc sprite: flat body, brighter rim, blurred edge. Bigger discs get softer edges.
    function makeSprite(rgb, edge, rim, size) {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const g = c.getContext('2d'), r = size / 2, [R, G, B] = rgb;
      const col = a => `rgba(${R},${G},${B},${a.toFixed(3)})`;
      const grad = g.createRadialGradient(r, r, 0, r, r, r), base = 0.42;
      grad.addColorStop(0, col(base * 0.95));
      grad.addColorStop(edge * 0.7, col(base));
      grad.addColorStop(edge, col(base + rim));
      for (let i = 1; i <= 8; i++) {
        const u = i / 8, fall = 1 - u * u * (3 - 2 * u);
        grad.addColorStop(edge + (1 - edge) * u, col((base + rim * (1 - u)) * fall));
      }
      g.fillStyle = grad; g.fillRect(0, 0, size, size);
      return c;
    }
    const cache = new Map();
    let W = 0, H = 0, dpr = 1, full = false, t = 0, level = 0, seeded = false, nextGiant = 0, nextSurge = 0;
    let balls = [], giants = [], extras = [];
    let LAYERS, GIANT, R_MIN, R_MAX, COUNT;

    function configure() {
      if (full) {
        // The original full-screen design, scaled to this screen
        const sc = H / 1080;
        R_MIN = 18 * sc; R_MAX = Math.max(W, H) / 2;
        LAYERS = [
          { weight: 0.45, r: [18 * sc, 60 * sc],  alpha: [0.55, 0.95], drift: 10 * sc },
          { weight: 0.35, r: [60 * sc, 140 * sc], alpha: [0.40, 0.75], drift: 7 * sc },
          { weight: 0.20, r: [140 * sc, 290 * sc], alpha: [0.22, 0.45], drift: 4 * sc }
        ];
        GIANT = { r: [290 * sc, R_MAX], drift: 2 * sc };
        COUNT = Math.round(58 * (W * H) / (1920 * 1080) * S.LIGHTS_DENSITY);
      } else {
        // Strip version: small sharp sparks, mid discs, soft large glows
        R_MIN = 3; R_MAX = 420;
        LAYERS = [
          { weight: 0.45, r: [3, 8],   alpha: [0.55, 0.95], drift: 5 },
          { weight: 0.35, r: [8, 16],  alpha: [0.40, 0.75], drift: 3.5 },
          { weight: 0.20, r: [16, 30], alpha: [0.22, 0.45], drift: 2 }
        ];
        GIANT = { r: [30, R_MAX], drift: 1.2 };
        COUNT = Math.round(W / 1280 * 32 * S.LIGHTS_DENSITY);
      }
      COUNT = Math.max(8, COUNT);
    }
    const sizeT = r => Math.max(0, Math.min(1, Math.log(r / R_MIN) / Math.log(R_MAX / R_MIN)));
    function spriteFor(ci, r) {
      const st = sizeT(r);
      const edge = Math.round((0.92 - 0.40 * Math.pow(st, 1.2)) * 50) / 50;
      const rim = Math.round(0.24 * (1 - st) * 50) / 50;
      const size = r * dpr > 150 ? 512 : r * dpr > 40 ? 256 : 96;
      const key = ci + ':' + edge + ':' + rim + ':' + size;
      let sp = cache.get(key);
      if (!sp) { sp = makeSprite(PALETTE[ci], edge, rim, size); cache.set(key, sp); }
      return sp;
    }
    function pickLayer() { let x = Math.random(); for (const l of LAYERS) { if ((x -= l.weight) <= 0) return l; } return LAYERS[0]; }
    function makeBall(delay, r, x, y, drift, peak, life, extra) {
      const ci = Math.floor(Math.random() * PALETTE.length), ang = Math.random() * Math.PI * 2, spd = rand(0.3, 1) * drift;
      return { x, y, r, vx: Math.cos(ang) * spd, vy: full ? Math.sin(ang) * spd - drift * 0.2 : 0, peak, extra,
        sprite: spriteFor(ci, r), born: t + delay, fadeIn: life[0], hold: life[1], fadeOut: life[2], breathe: rand(0, Math.PI * 2) };
    }
    function spawn(delay = 0, extra = false) {
      const L = pickLayer();
      const life = extra ? [rand(0.6, 1.4), rand(1, 4), rand(1.5, 3)] : [rand(3.5, 7), rand(1.5, 7), rand(4, 9)];
      const r = rand(L.r[0], L.r[1]);
      // In the strip, keep whole discs inside the band; full screen can run off the edges
      const y = full ? rand(-0.05, 1.05) * H : (r * 2 < H ? rand(r + 1, H - r - 1) : H / 2);
      return makeBall(delay, r, rand(-0.05, 1.05) * W, y, L.drift, rand(L.alpha[0], L.alpha[1]) * (full ? 1 : 1.3), life, extra);
    }
    function spawnGiant() {
      const u = Math.pow(Math.random(), 1.6), r = GIANT.r[0] * Math.pow(GIANT.r[1] / GIANT.r[0], u);
      const peak = rand(0.16, 0.26) * (1 - 0.45 * sizeT(r));
      return makeBall(0, r, rand(0.1, 0.9) * W, full ? rand(0.1, 0.9) * H : H / 2, GIANT.drift, peak, [rand(8, 14), rand(3, 9), rand(10, 16)], false);
    }
    function drawBall(b, dt, mult, still) {
      const age = t - b.born;
      if (age < 0) return true;
      const life = b.fadeIn + b.hold + b.fadeOut;
      if (age >= life) return false;
      let a = age < b.fadeIn ? smooth(age / b.fadeIn) : age < b.fadeIn + b.hold ? 1 : 1 - smooth((age - b.fadeIn - b.hold) / b.fadeOut);
      if (b.extra) a *= Math.min(1, level * 2);
      if (!still) { b.x += b.vx * mult * dt; b.y += b.vy * mult * dt; }
      const r = b.r * (1 + 0.025 * Math.sin(t * 0.35 + b.breathe));
      ctx.globalAlpha = a * b.peak;
      ctx.drawImage(b.sprite, b.x - r, b.y - r, r * 2, r * 2);
      return true;
    }
    return {
      resize(w, h, d, isFull) {
        const changed = isFull !== full || d !== dpr;
        W = w; H = h; dpr = d; full = isFull;
        cv.width = W * dpr; cv.height = H * dpr;
        configure();
        if (changed || !seeded) { cache.clear(); balls = []; giants = []; extras = []; seeded = false; }
      },
      step(dtMs, lv, still) {
        const dt = Math.min(0.1, dtMs / 1000);
        level = lv; t += dt;
        if (!seeded) {
          seeded = true;
          // Start mid-life so the band is already lit on arrival
          for (let i = 0; i < COUNT; i++) { const b = spawn(); b.born -= rand(0, b.fadeIn + b.hold); balls.push(b); }
          nextGiant = t + rand(6, 14);
        }
        const mult = 1 + level * (S.LIGHTS_SPEEDUP - 1);
        if (!still && t >= nextGiant) { giants.push(spawnGiant()); nextGiant = t + rand(15, 40); }
        if (!still && level > .03 && t >= nextSurge && extras.length < level * S.LIGHTS_EXTRA * (full ? 3 : 1)) {
          extras.push(spawn(0, true)); nextSurge = t + rand(0.03, 0.15) / (.3 + level);
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
        ctx.clearRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'lighter';
        for (let i = giants.length - 1; i >= 0; i--) if (!drawBall(giants[i], dt, mult, still)) giants.splice(i, 1);
        for (let i = 0; i < balls.length; i++) if (!drawBall(balls[i], dt, mult, still)) balls[i] = spawn(rand(0, 2.5));
        for (let i = extras.length - 1; i >= 0; i--) if (!drawBall(extras[i], dt, mult, still) || level < .01) extras.splice(i, 1);
        ctx.globalAlpha = 1;
      }
    };
  }

  /* ================= Diatoms (from Diatomarium, prototype 4) ================= */
  function diatomBand(stage) {
    const pick = a => a[Math.floor(Math.random() * a.length)];
    const TAU = Math.PI * 2;
    // ---------- Color: dark-field blues, teals and the odd violet ----------
    function hueFor() {
      const r = Math.random();
      if (r < 0.31) return rand(188, 205);
      if (r < 0.50) return rand(170, 188);
      if (r < 0.65) return rand(205, 222);
      if (r < 0.75) return rand(150, 170);
      if (r < 0.83) return rand(228, 245);
      if (r < 0.92) return rand(32, 48);       // amber, like interference tints
      return rand(316, 338);                   // rose
    }
    const hsla = (h, s, l, a) => `hsla(${h.toFixed(0)},${s}%,${l}%,${a})`;
  
    // ---------- Pattern helpers ----------
    function hexGrid(B, sp, rot) {
      const pts = [], rowH = sp * 0.866;
      const c = Math.cos(rot), s = Math.sin(rot);
      for (let j = -Math.ceil(B / rowH) - 1; j <= Math.ceil(B / rowH) + 1; j++) {
        const off = (j & 1) ? sp / 2 : 0;
        for (let i = -Math.ceil(B / sp) - 1; i <= Math.ceil(B / sp) + 1; i++) {
          const x = i * sp + off, y = j * rowH;
          pts.push([x * c - y * s, x * s + y * c]);
        }
      }
      return pts;
    }
    function dot(g, x, y, r) { g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU); }
  
    function rim(g, path, h, width, glow) {
      g.save();
      g.shadowColor = hsla(h, 85, 70, 0.9);
      g.shadowBlur = glow;
      g.strokeStyle = hsla(h, 70, 82, 0.95);
      g.lineWidth = width;
      g.stroke(path);
      g.shadowBlur = 0;
      g.strokeStyle = hsla(h, 90, 92, 0.6);
      g.lineWidth = width * 0.35;
      g.stroke(path);
      g.restore();
    }
    function body(g, path, h, R, darkCenter) {
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, R);
      gr.addColorStop(0, hsla(h, 55, darkCenter ? 3 : 10, 0.96));
      gr.addColorStop(1, hsla(h, 60, 16, 0.96));
      g.fillStyle = gr;
      g.fill(path);
    }
    // Areolae: dots clipped to the shape, sized and lit by a radial profile
    function areolae(g, path, R, h, sp, profile, skip) {
      g.save();
      g.clip(path);
      g.globalCompositeOperation = 'lighter';
      const pts = hexGrid(R * 1.05, sp, rand(0, TAU));
      const bands = 6;
      const paths = Array.from({ length: bands }, () => new Path2D());
      for (const [x, y] of pts) {
        const rho = Math.hypot(x, y) / R;
        if (rho > 1.02 || (skip && skip(x, y, rho))) continue;
        const v = profile(rho);                         // 0..1 size/brightness
        const b = Math.min(bands - 1, Math.floor(v * bands));
        dot(paths[b], x, y, sp * (0.16 + 0.24 * v));
      }
      paths.forEach((p, b) => {
        const v = (b + 0.5) / bands;
        g.fillStyle = hsla(h, 65, 45 + 30 * v, 0.35 + 0.5 * v);
        g.fill(p);
      });
      g.restore();
    }
  
    // ---------- Diatom forms ----------
    // Each returns { draw(g), extent } with the shape centered at 0,0 within radius R.
    const FORMS = {
      centric(R, h) {
        const p = new Path2D(); p.arc(0, 0, R * 0.97, 0, TAU);
        const darkCenter = Math.random() < 0.3;
        const hyal = Math.random() < 0.5 ? R * rand(0.05, 0.16) : 0;
        const sp = Math.max(3.6, Math.min(9, R * rand(0.035, 0.065)));
        const prof = pick([
          r => 0.35 + 0.65 * r,
          r => 1 - 0.6 * r,
          r => 0.55 + 0.45 * Math.sin(r * Math.PI),
          r => darkCenter ? Math.max(0, (r - 0.45) / 0.55) : 0.7,
        ]);
        return { genus: 'Coscinodiscus', draw(g) {
          body(g, p, h, R, darkCenter);
          areolae(g, p, R, h, sp, prof, (x, y, r) => r * R < hyal || (darkCenter && r < 0.42));
          if (hyal) {
            g.save(); g.globalCompositeOperation = 'lighter';
            const n = Math.floor(rand(5, 9)), q = new Path2D();
            for (let i = 0; i < n; i++) { const a = i / n * TAU; dot(q, Math.cos(a) * hyal, Math.sin(a) * hyal, sp * 0.45); }
            g.fillStyle = hsla(h, 70, 75, 0.85); g.fill(q); g.restore();
          }
          // marginal ring of fine dots
          g.save(); g.globalCompositeOperation = 'lighter';
          const m = new Path2D(), n = Math.floor(TAU * R * 0.92 / (sp * 0.6));
          for (let i = 0; i < n; i++) { const a = i / n * TAU; dot(m, Math.cos(a) * R * 0.92, Math.sin(a) * R * 0.92, sp * 0.14); }
          g.fillStyle = hsla(h, 70, 80, 0.7); g.fill(m); g.restore();
          rim(g, p, h, 2.2, 10);
          const inner = new Path2D(); inner.arc(0, 0, R * 0.88, 0, TAU);
          g.strokeStyle = hsla(h, 60, 70, 0.25); g.lineWidth = 1; g.stroke(inner);
        } };
      },
  
      radial(R, h) {
        const p = new Path2D(); p.arc(0, 0, R * 0.97, 0, TAU);
        const n = 2 * Math.floor(rand(3, 8));
        const c = R * rand(0.1, 0.22);
        const sp = Math.max(3.6, Math.min(8, R * rand(0.035, 0.055)));
        const twist = Math.random() < 0.4 ? rand(-0.5, 0.5) : 0;
        return { genus: pick(['Actinoptychus', 'Arachnoidiscus']), draw(g) {
          body(g, p, h, R, false);
          g.save(); g.clip(p);
          for (let i = 0; i < n; i++) {
            const a0 = i / n * TAU, a1 = (i + 1) / n * TAU;
            if (i & 1) {
              const w = new Path2D(); w.moveTo(0, 0); w.arc(0, 0, R, a0, a1); w.closePath();
              g.fillStyle = hsla(h, 60, 30, 0.35); g.fill(w);
            }
          }
          g.globalCompositeOperation = 'lighter';
          const dots = new Path2D(), dotsB = new Path2D();
          for (let rho = c + sp; rho < R * 0.93; rho += sp * 0.9) {
            const k = Math.max(1, Math.floor(TAU * rho / (sp * 1.05)));
            for (let i = 0; i < k; i++) {
              const a = i / k * TAU + twist * (rho / R);
              const sector = Math.floor(((a % TAU) + TAU) % TAU / TAU * n);
              dot((sector & 1) ? dots : dotsB, Math.cos(a) * rho, Math.sin(a) * rho, sp * (0.18 + 0.16 * rho / R));
            }
          }
          g.fillStyle = hsla(h, 65, 70, 0.75); g.fill(dots);
          g.fillStyle = hsla(h, 60, 55, 0.5); g.fill(dotsB);
          // spokes
          g.strokeStyle = hsla(h, 80, 82, 0.8); g.lineWidth = 1.3;
          g.shadowColor = hsla(h, 85, 70, 0.8); g.shadowBlur = 5;
          g.beginPath();
          for (let i = 0; i < n; i++) {
            const a = i / n * TAU;
            g.moveTo(Math.cos(a) * c, Math.sin(a) * c);
            g.quadraticCurveTo(Math.cos(a + twist * 0.5) * R * 0.5, Math.sin(a + twist * 0.5) * R * 0.5,
                               Math.cos(a + twist) * R * 0.95, Math.sin(a + twist) * R * 0.95);
          }
          g.stroke();
          g.restore();
          const hc = new Path2D(); hc.arc(0, 0, c, 0, TAU);
          g.fillStyle = hsla(h, 50, 6, 0.9); g.fill(hc);
          rim(g, hc, h, 1.4, 6);
          rim(g, p, h, 2.2, 10);
        } };
      },
  
      polygon(R, h) {
        const n = Math.random() < 0.72 ? 3 : (Math.random() < 0.7 ? 4 : 5);
        const bulge = (Math.random() < 0.3 ? rand(-0.32, -0.14) : rand(-0.1, 0.2)) * R;
        const rot0 = rand(0, TAU);
        const V = [];
        for (let i = 0; i < n; i++) { const a = rot0 + i / n * TAU; V.push([Math.cos(a) * R * 0.97, Math.sin(a) * R * 0.97]); }
        const round = rand(0.08, 0.18);
        const p = new Path2D();
        const lerpP = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
        for (let i = 0; i < n; i++) {
          const A = V[i], B = V[(i + 1) % n], C = V[(i + 2) % n];
          const s = lerpP(A, B, round), e = lerpP(A, B, 1 - round);
          const m = lerpP(A, B, 0.5), mm = Math.hypot(m[0], m[1]);
          const ctrl = [m[0] + m[0] / mm * bulge * 2, m[1] + m[1] / mm * bulge * 2];
          if (i === 0) p.moveTo(s[0], s[1]);
          p.quadraticCurveTo(ctrl[0], ctrl[1], e[0], e[1]);
          const s2 = lerpP(B, C, round);
          p.quadraticCurveTo(B[0], B[1], s2[0], s2[1]);
        }
        p.closePath();
        const sp = Math.max(3.6, Math.min(9, R * rand(0.04, 0.07)));
        const prof = pick([r => 1 - 0.55 * r, r => 0.4 + 0.6 * r, r => 0.75]);
        return { genus: n === 3 ? 'Triceratium' : (n === 4 ? 'Amphitetras' : 'Pentapodiscus'), draw(g) {
          body(g, p, h, R, false);
          areolae(g, p, R, h, sp, prof);
          // corner ocelli: little domed eyes at each corner
          g.save(); g.globalCompositeOperation = 'lighter';
          for (const v of V) {
            const cx = v[0] * 0.8, cy = v[1] * 0.8, rr = R * 0.07;
            const o = new Path2D(); o.arc(cx, cy, rr, 0, TAU);
            g.fillStyle = hsla(h, 60, 25, 0.8); g.fill(o);
            const q = new Path2D();
            for (const [x, y] of hexGrid(rr, rr * 0.35, 0)) if (Math.hypot(x, y) < rr * 0.85) dot(q, cx + x, cy + y, rr * 0.08);
            g.fillStyle = hsla(h, 70, 80, 0.8); g.fill(q);
            rim(g, o, h, 1, 4);
          }
          g.restore();
          rim(g, p, h, 2.4, 12);
          g.save(); g.scale(0.93, 0.93);
          g.strokeStyle = hsla(h, 60, 70, 0.22); g.lineWidth = 1.2; g.stroke(p);
          g.restore();
        } };
      },
  
      star(R, h) {
        const p = new Path2D(); p.arc(0, 0, R * 0.97, 0, TAU);
        const n = Math.floor(rand(5, 13));
        const c = R * rand(0.28, 0.42);
        const sp = Math.max(3.6, Math.min(8, R * rand(0.04, 0.06)));
        return { genus: 'Asterolampra', draw(g) {
          body(g, p, h, R, true);
          areolae(g, p, R, h, sp, r => Math.max(0, (r - 0.4) / 0.6), (x, y, r) => r * R < c * 1.05);
          const hc = new Path2D(); hc.arc(0, 0, c, 0, TAU);
          g.fillStyle = hsla(h, 50, 3, 0.95); g.fill(hc);
          g.save();
          g.globalCompositeOperation = 'lighter';
          g.shadowColor = hsla(h, 90, 70, 0.9); g.shadowBlur = 8;
          for (let i = 0; i < n; i++) {
            const a = i / n * TAU, w = TAU / n * 0.16;
            const ray = new Path2D();
            ray.moveTo(Math.cos(a - w) * c * 0.25, Math.sin(a - w) * c * 0.25);
            ray.lineTo(Math.cos(a) * R * 0.86, Math.sin(a) * R * 0.86);
            ray.lineTo(Math.cos(a + w) * c * 0.25, Math.sin(a + w) * c * 0.25);
            ray.closePath();
            g.fillStyle = hsla(h, 70, 72, 0.55); g.fill(ray);
          }
          g.restore();
          rim(g, hc, h, 1.2, 6);
          rim(g, p, h, 2.2, 10);
        } };
      },
  
      pennate(R, h) {
        const w = R / rand(2.6, 4.4), q = rand(1.4, 2.4);
        const pts = [];
        for (let i = 0; i <= 80; i++) {
          const t = i / 80 * TAU;
          const cx = Math.cos(t), sy = Math.sin(t);
          pts.push([Math.sign(cx) * Math.pow(Math.abs(cx), 2 / q) * R * 0.97, Math.sign(sy) * Math.pow(Math.abs(sy), 2 / q) * w]);
        }
        const p = new Path2D(); p.moveTo(...pts[0]); for (const pt of pts) p.lineTo(...pt); p.closePath();
        const sp = Math.max(3.4, Math.min(7, w * rand(0.13, 0.2)));
        return { genus: pick(['Navicula', 'Pinnularia', 'Surirella']), draw(g) {
          body(g, p, h, R, false);
          g.save(); g.clip(p); g.globalCompositeOperation = 'lighter';
          const d = new Path2D();
          for (let x = -R; x <= R; x += sp) {
            const ang = (x / R) * 0.35;                      // striae fan out from the middle
            if (Math.abs(x) < sp * 1.2) continue;
            for (const side of [-1, 1]) {
              for (let s = sp * 0.9; s < w * 1.1; s += sp * 0.6) {
                dot(d, x + Math.sin(ang) * s * side, side * s * Math.cos(ang), sp * 0.17);
              }
            }
          }
          g.fillStyle = hsla(h, 65, 70, 0.75); g.fill(d);
          g.restore();
          // raphe with a central nodule
          g.save();
          g.shadowColor = hsla(h, 90, 70, 0.8); g.shadowBlur = 5;
          g.strokeStyle = hsla(h, 80, 85, 0.9); g.lineWidth = 1.4;
          g.beginPath(); g.moveTo(-R * 0.86, 0); g.lineTo(-sp * 1.4, 0); g.moveTo(sp * 1.4, 0); g.lineTo(R * 0.86, 0); g.stroke();
          g.beginPath(); g.ellipse(0, 0, sp * 1.1, sp * 0.8, 0, 0, TAU);
          g.fillStyle = hsla(h, 70, 75, 0.8); g.fill();
          g.restore();
          rim(g, p, h, 2, 9);
        } };
      },
  
      chain(R, h) {
        const k = Math.floor(rand(3, 6));
        const cw = (2 * R * 0.94) / k, ch = Math.min(R * 0.55, cw * rand(0.8, 1.25)) / 2;
        const cells = [];
        for (let i = 0; i < k; i++) cells.push(-R * 0.94 + cw * (i + 0.5));
        const sp = Math.max(3.4, Math.min(7, ch * rand(0.16, 0.24)));
        return { genus: pick(['Biddulphia', 'Isthmia', 'Terpsinoe']), draw(g) {
          for (const cx of cells) {
            const p = new Path2D();
            p.ellipse(cx, 0, cw * 0.5, ch, 0, 0, TAU);
            body(g, p, h, R, false);
            g.save(); g.clip(p); g.globalCompositeOperation = 'lighter';
            const d = new Path2D();
            for (const [x, y] of hexGrid(Math.max(cw, ch), sp, 0.3)) {
              const rx = x / (cw * 0.5), ry = y / ch;
              if (rx * rx + ry * ry > 1) continue;
              dot(d, cx + x, y, sp * (0.15 + 0.15 * (1 - Math.hypot(rx, ry))));
            }
            g.fillStyle = hsla(h, 65, 68, 0.7); g.fill(d);
            g.restore();
            // horns at each end of the cell
            g.save(); g.globalCompositeOperation = 'lighter';
            for (const s of [-1, 1]) {
              const hn = new Path2D(); hn.arc(cx + s * cw * 0.42, -ch * 0.75, ch * 0.16, 0, TAU);
              g.fillStyle = hsla(h, 70, 75, 0.7); g.fill(hn);
            }
            const cdot = new Path2D(); cdot.arc(cx, 0, ch * 0.18, 0, TAU);
            g.fillStyle = hsla(h, 60, 80, 0.6); g.fill(cdot);
            g.restore();
            rim(g, p, h, 1.8, 8);
          }
        } };
      },
    };
    // ======================================================================
    // Expanded library (prototype 4): stars, three-armed forms, lemons,
    // waisted and knotted pennates, rods, crescents, S-curves, ribbed ovals,
    // rosette discs, rings, girdle views and living filament chains.
    // ======================================================================
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    function envelope(x, R, q) {
      const u = Math.min(1, Math.abs(x) / (R * 0.97));
      return Math.pow(Math.max(0, 1 - Math.pow(u, q)), 1 / q);
    }
    function roundRectPath(p, x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      p.moveTo(x + r, y); p.lineTo(x + w - r, y); p.quadraticCurveTo(x + w, y, x + w, y + r);
      p.lineTo(x + w, y + h - r); p.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      p.lineTo(x + r, y + h); p.quadraticCurveTo(x, y + h, x, y + h - r);
      p.lineTo(x, y + r); p.quadraticCurveTo(x, y, x + r, y); p.closePath();
    }
    function polarPath(fn, n = 360) {
      const p = new Path2D();
      for (let i = 0; i <= n; i++) {
        const a = i / n * TAU, r = fn(a);
        if (i === 0) p.moveTo(Math.cos(a) * r, Math.sin(a) * r); else p.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      p.closePath();
      return p;
    }
  
    // Shared builder for boat-, rod-, lemon- and S-shaped valves
    function pennateLike(R, h, o) {
      const N = 160, top = [], bot = [];
      const X0 = -R * 0.97, X1 = R * 0.97;
      const bend = o.bend || (() => 0);
      let Wmax = 0;
      for (let i = 0; i <= N; i++) {
        const x = X0 + (X1 - X0) * i / N;
        const ww = Math.max(0.6, o.w(x)), c = bend(x);
        Wmax = Math.max(Wmax, ww);
        top.push([x, c - ww]); bot.push([x, c + ww]);
      }
      const p = new Path2D();
      p.moveTo(top[0][0], top[0][1]);
      for (const q of top) p.lineTo(q[0], q[1]);
      for (let i = bot.length - 1; i >= 0; i--) p.lineTo(bot[i][0], bot[i][1]);
      p.closePath();
      const sp = clamp(Wmax * rand(0.13, 0.2), 2.8, 7);
      const fan = o.fan ?? rand(0.2, 0.5);
      return { genus: o.genus, draw(g) {
        body(g, p, h, R, false);
        g.save(); g.clip(p); g.globalCompositeOperation = 'lighter';
        const d = new Path2D();
        for (let x = X0; x <= X1; x += sp) {
          const c = bend(x), ww = o.w(x), ang = fan * (x / R);
          if (o.raphe && Math.abs(x) < sp * 1.2) continue;
          for (const side of [-1, 1]) {
            for (let s = sp * 0.9; s < ww * 1.15; s += sp * 0.6) {
              dot(d, x + Math.sin(ang) * s * side, c + side * s * Math.cos(ang), sp * 0.17);
            }
          }
        }
        g.fillStyle = hsla(h, 65, 70, o.style === 'ribs' ? 0.35 : 0.75); g.fill(d);
        if (o.style === 'ribs') {
          g.shadowColor = hsla(h, 85, 70, 0.8); g.shadowBlur = 4;
          g.strokeStyle = hsla(h, 75, 80, 0.75); g.lineWidth = 1.7;
          g.beginPath();
          for (let x = X0 + sp * 2; x < X1 - sp; x += sp * 2.6) {
            const c = bend(x), ww = o.w(x), tilt = fan * (x / R) * ww;
            g.moveTo(x + tilt, c - ww * 1.05);
            g.quadraticCurveTo(x, c, x + tilt, c + ww * 1.05);
          }
          g.stroke();
        }
        g.restore();
        if (o.stauros) {
          g.save(); g.clip(p);
          g.fillStyle = hsla(h, 50, 5, 0.7);
          g.fillRect(-sp * 1.4, -R, sp * 2.8, 2 * R);
          g.restore();
        }
        if (o.raphe || o.midline) {
          g.save();
          g.shadowColor = hsla(h, 90, 70, 0.8); g.shadowBlur = 5;
          g.strokeStyle = hsla(h, 80, 85, o.raphe ? 0.9 : 0.5); g.lineWidth = o.raphe ? 1.4 : 1;
          g.beginPath();
          let started = false;
          for (let x = X0 * 0.9; x <= X1 * 0.9; x += 2) {
            if (o.raphe && Math.abs(x) < sp * 1.4) { started = false; continue; }
            if (!started) { g.moveTo(x, bend(x)); started = true; } else g.lineTo(x, bend(x));
          }
          g.stroke();
          if (o.raphe) {
            g.beginPath(); g.ellipse(0, bend(0), sp * 1.1, sp * 0.8, 0, 0, TAU);
            g.fillStyle = hsla(h, 70, 75, 0.8); g.fill();
          }
          g.restore();
        }
        rim(g, p, h, 2, 9);
      } };
    }
  
    Object.assign(FORMS, {
      lemon(R, h) {
        const W = R / rand(1.8, 3), q = rand(1.15, 1.6), rostrate = Math.random() < 0.5;
        return pennateLike(R, h, {
          genus: pick(['Navicula', 'Lyrella', 'Petroneis']), raphe: true, stauros: Math.random() < 0.25,
          w: x => {
            const u = Math.abs(x) / (R * 0.97);
            const beak = rostrate ? 1 - 0.4 * clamp((u - 0.7) / 0.3, 0, 1) : 1;
            return W * envelope(x, R, q) * beak;
          },
        });
      },
      waisted(R, h) {
        const W = R / rand(2.2, 3.2), q = rand(2, 3), pinch = rand(0.25, 0.5);
        return pennateLike(R, h, {
          genus: pick(['Diploneis', 'Caloneis', 'Navicula']), raphe: true,
          w: x => W * envelope(x, R, q) * (1 - pinch * Math.exp(-Math.pow(x / (0.2 * R), 2))),
        });
      },
      rod(R, h) {
        const W = R / rand(9, 15), cap = rand(0, 0.8), mid = Math.random() < 0.5 ? rand(0.2, 0.5) : 0;
        return pennateLike(R, h, {
          genus: pick(['Synedra', 'Ulnaria', 'Fragilaria']), midline: true, fan: 0,
          w: x => W * envelope(x, R, 8)
            * (1 + cap * Math.exp(-Math.pow((R * 0.97 - Math.abs(x)) / (0.05 * R), 2)))
            * (1 + mid * Math.exp(-Math.pow(x / (0.08 * R), 2))),
        });
      },
      nodose(R, h) {
        const W = R / rand(4.5, 7), kk = Math.floor(rand(2, 5));
        return pennateLike(R, h, {
          genus: pick(['Terpsinoe', 'Gomphonema', 'Rhabdonema']), raphe: true,
          w: x => W * envelope(x, R, 4) * (0.58 + 0.42 * Math.abs(Math.cos(kk * Math.PI * x / (2 * R * 0.97)))),
        });
      },
      crescent(R, h) {
        const W = R / rand(3, 4.5), B = rand(0.12, 0.25) * R;
        return pennateLike(R, h, {
          genus: pick(['Cymbella', 'Amphora', 'Encyonema']), raphe: true,
          bend: x => B * (1 - Math.pow(x / (R * 0.97), 2)) - B * 0.5,
          w: x => W * envelope(x, R, 1.7),
        });
      },
      sigmoid(R, h) {
        const W = R / rand(6, 9), S = rand(0.12, 0.22) * R;
        return pennateLike(R, h, {
          genus: pick(['Pleurosigma', 'Gyrosigma']), raphe: true, fan: 0.15,
          bend: x => S * Math.sin(Math.PI * x / (R * 0.97)),
          w: x => W * envelope(x, R, 1.6),
        });
      },
      surirella(R, h) {
        const W = R / rand(1.6, 2.4), q = rand(1.8, 2.6), tilt = rand(0.08, 0.22);
        return pennateLike(R, h, {
          genus: pick(['Surirella', 'Campylodiscus', 'Petrodictyon']), midline: true, style: 'ribs', fan: rand(0.2, 0.5),
          w: x => W * envelope(x, R, q) * (1 + tilt * x / R),
        });
      },
  
      stellate(R, h) {
        const n = Math.floor(rand(4, 8)), v = rand(0.42, 0.62), pw = rand(1.3, 3.5), rot = rand(0, TAU);
        const fn = a => R * 0.97 * (v + (1 - v) * Math.pow(Math.abs(Math.cos(n * (a - rot) / 2)), pw));
        const p = polarPath(fn);
        const sp = clamp(R * rand(0.035, 0.06), 3.4, 8);
        const prof = pick([r => 1 - 0.5 * r, r => 0.4 + 0.6 * r, r => 0.7]);
        const genus = n === 4 ? 'Amphitetras' : n === 5 ? 'Amphipentas' : 'Stictodiscus';
        return { genus, draw(g) {
          body(g, p, h, R, false);
          areolae(g, p, R, h, sp, prof);
          g.save(); g.globalCompositeOperation = 'lighter';
          const q = new Path2D(), m = Math.floor(rand(5, 9)), rr = R * rand(0.12, 0.2);
          for (let i = 0; i < m; i++) { const a = i / m * TAU; dot(q, Math.cos(a) * rr, Math.sin(a) * rr, sp * 0.45); }
          for (let i = 0; i < n; i++) { const a = rot + i / n * TAU; dot(q, Math.cos(a) * R * 0.86, Math.sin(a) * R * 0.86, sp * 0.6); }
          g.fillStyle = hsla(h, 70, 80, 0.85); g.fill(q);
          g.restore();
          rim(g, p, h, 2.2, 10);
        } };
      },
      triradiate(R, h) {
        const n = Math.random() < 0.72 ? 3 : 4, v = rand(0.2, 0.32), pw = rand(5, 10), rot = rand(0, TAU);
        const fn = a => {
          const c = Math.abs(Math.cos(n * (a - rot) / 2));
          return R * 0.93 * (v + (1 - v) * Math.pow(c, pw)) + R * 0.05 * Math.pow(c, 60);
        };
        const p = polarPath(fn, 600);
        const sp = clamp(R * rand(0.03, 0.045), 3, 6);
        return { genus: n === 3 ? 'Trinacria' : 'Amphitetras', draw(g) {
          body(g, p, h, R, false);
          areolae(g, p, R, h, sp, r => 0.5 + 0.5 * r);
          g.save(); g.globalCompositeOperation = 'lighter';
          for (let i = 0; i < n; i++) {
            const a = rot + i / n * TAU;
            const o = new Path2D(); o.arc(Math.cos(a) * R * 0.86, Math.sin(a) * R * 0.86, R * 0.055, 0, TAU);
            g.fillStyle = hsla(h, 60, 30, 0.8); g.fill(o);
            rim(g, o, h, 1, 4);
          }
          const c = new Path2D(); c.arc(0, 0, R * v * 0.6, 0, TAU);
          rim(g, c, h, 1, 5);
          g.restore();
          rim(g, p, h, 2.2, 10);
        } };
      },
      lobed(R, h) {
        const m = Math.floor(rand(10, 24)), petals = Math.floor(rand(3, 9)), proc = Math.floor(rand(3, 7));
        const fn = a => R * 0.95 * (1 + 0.025 * Math.cos(m * a));
        const p = polarPath(fn);
        const sp = clamp(R * rand(0.03, 0.05), 3.2, 7);
        const pr = R * rand(0.3, 0.42), pw = R * rand(0.1, 0.17);
        return { genus: pick(['Aulacodiscus', 'Auliscus', 'Eupodiscus']), draw(g) {
          body(g, p, h, R, false);
          areolae(g, p, R, h, sp, r => 0.35 + 0.65 * r);
          g.save();
          for (let i = 0; i < petals; i++) {
            const a = i / petals * TAU;
            const e = new Path2D(); e.ellipse(Math.cos(a) * pr, Math.sin(a) * pr, pw * 1.5, pw, a, 0, TAU);
            g.fillStyle = hsla(h, 50, 8, 0.7); g.fill(e);
            rim(g, e, h, 1.2, 5);
          }
          g.globalCompositeOperation = 'lighter';
          for (let i = 0; i < proc; i++) {
            const a = i / proc * TAU + 0.3;
            const o = new Path2D(); o.arc(Math.cos(a) * R * 0.8, Math.sin(a) * R * 0.8, R * 0.06, 0, TAU);
            g.fillStyle = hsla(h, 70, 75, 0.5); g.fill(o);
            rim(g, o, h, 1, 4);
          }
          g.restore();
          rim(g, p, h, 2.2, 10);
        } };
      },
      ring(R, h) {
        const ri = R * rand(0.42, 0.68), ro = R * 0.96;
        const p = new Path2D(); p.arc(0, 0, ro, 0, TAU); p.moveTo(ri, 0); p.arc(0, 0, ri, 0, TAU, true);
        const outer = new Path2D(); outer.arc(0, 0, ro, 0, TAU);
        const inner = new Path2D(); inner.arc(0, 0, ri, 0, TAU);
        const sp = clamp(R * rand(0.035, 0.06), 3.2, 7);
        return { genus: pick(['Cyclotella', 'Melosira', 'Stephanodiscus']), draw(g) {
          g.fillStyle = hsla(h, 55, 13, 0.95); g.fill(p, 'evenodd');
          g.save(); g.clip(p, 'evenodd'); g.globalCompositeOperation = 'lighter';
          const d = new Path2D();
          const rays = Math.floor(TAU * ro / (sp * 1.1));
          for (let i = 0; i < rays; i++) {
            const a = i / rays * TAU;
            for (let rho = ri + sp * 0.8; rho < ro - sp * 0.5; rho += sp * 0.7) dot(d, Math.cos(a) * rho, Math.sin(a) * rho, sp * 0.16);
          }
          g.fillStyle = hsla(h, 65, 72, 0.75); g.fill(d);
          g.restore();
          rim(g, outer, h, 2.2, 10);
          rim(g, inner, h, 1.6, 8);
        } };
      },
      girdle(R, h) {
        const A = R * 0.8, B = R * rand(0.28, 0.55), horn = Math.random() < 0.7, spines = Math.random() < 0.5;
        const p = new Path2D(); roundRectPath(p, -A, -B, 2 * A, 2 * B, B * rand(0.15, 0.4));
        const sp = clamp(B * rand(0.12, 0.18), 3, 7);
        const valve = A * rand(0.45, 0.65);
        return { genus: pick(['Biddulphia', 'Isthmia', 'Hemiaulus']), draw(g) {
          body(g, p, h, R, false);
          g.save(); g.clip(p); g.globalCompositeOperation = 'lighter';
          const d = new Path2D();
          for (const [x, y] of hexGrid(R, sp, 0)) {
            if (Math.abs(x) < valve) continue;
            dot(d, x, y, sp * 0.2);
          }
          g.fillStyle = hsla(h, 65, 72, 0.75); g.fill(d);
          g.strokeStyle = hsla(h, 70, 78, 0.35); g.lineWidth = 1;
          g.beginPath();
          for (let x = -valve; x <= valve; x += sp * 1.6) { g.moveTo(x, -B); g.lineTo(x, B); }
          g.stroke();
          g.strokeStyle = hsla(h, 75, 82, 0.8); g.lineWidth = 1.6;
          g.beginPath(); g.moveTo(-valve, -B); g.lineTo(-valve, B); g.moveTo(valve, -B); g.lineTo(valve, B); g.stroke();
          g.restore();
          g.save(); g.globalCompositeOperation = 'lighter';
          for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
            if (horn) {
              const o = new Path2D(); o.ellipse(sx * A * 0.9, sy * (B + B * 0.12), A * 0.07, B * 0.14, 0, 0, TAU);
              g.fillStyle = hsla(h, 70, 75, 0.6); g.fill(o);
            }
            if (spines) {
              g.strokeStyle = hsla(h, 70, 80, 0.55); g.lineWidth = 1.1;
              g.beginPath(); g.moveTo(sx * A * 0.9, sy * B);
              g.lineTo(sx * (A * 0.9 + R * 0.12), sy * (B + R * 0.22)); g.stroke();
            }
          }
          g.restore();
          rim(g, p, h, 2.2, 10);
        } };
      },
      filament(R, h) {
        // A living chain: cells strung along a gentle curve, with golden-green chloroplasts
        const span = R * 0.82, bow = rand(-0.26, 0.26) * R;
        const P = [];
        for (let i = 0; i <= 200; i++) {
          const t = i / 200;
          P.push([(1 - t) * (1 - t) * -span + t * t * span, 2 * (1 - t) * t * bow * 2]);
        }
        const cum = [0];
        for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
        const L = cum[cum.length - 1];
        const at = s => {
          let i = 1; while (i < cum.length - 1 && cum[i] < s) i++;
          const u = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
          return [P[i - 1][0] + (P[i][0] - P[i - 1][0]) * u, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * u,
                  Math.atan2(P[i][1] - P[i - 1][1], P[i][0] - P[i - 1][0])];
        };
        const k = Math.floor(rand(4, 10));
        const cellLen = L / k, gap = cellLen * rand(0.06, 0.2), cl = cellLen - gap;
        const ch = Math.min(R * 0.42, cl * rand(0.6, 1.6));
        const setae = Math.random() < 0.45, hair = R * rand(0.2, 0.42);
        const chl = rand(68, 100);
        return { genus: pick(['Fragilaria', 'Chaetoceros', 'Melosira', 'Skeletonema']), draw(g) {
          if (setae) {
            g.save(); g.globalCompositeOperation = 'lighter';
            g.strokeStyle = hsla(h, 50, 75, 0.35); g.lineWidth = 0.8;
            g.beginPath();
            for (let i = 1; i < k; i++) {
              const [x, y, a] = at(i * cellLen);
              const nx = -Math.sin(a), ny = Math.cos(a);
              for (const s of [-1, 1]) {
                const sw = rand(-0.4, 0.4);
                g.moveTo(x, y);
                g.quadraticCurveTo(x + nx * s * hair * 0.5, y + ny * s * hair * 0.5,
                                   x + (nx * s + Math.cos(a) * sw) * hair, y + (ny * s + Math.sin(a) * sw) * hair);
              }
            }
            g.stroke(); g.restore();
          }
          for (let i = 0; i < k; i++) {
            const [x, y, a] = at((i + 0.5) * cellLen);
            g.save(); g.translate(x, y); g.rotate(a);
            const c = new Path2D(); roundRectPath(c, -cl / 2, -ch / 2, cl, ch, Math.min(cl, ch) * 0.3);
            g.fillStyle = hsla(h, 45, 14, 0.9); g.fill(c);
            g.save(); g.clip(c); g.globalCompositeOperation = 'lighter';
            const blobs = Math.random() < 0.5 ? 1 : 2;
            for (let b = 0; b < blobs; b++) {
              const e = new Path2D();
              const bx = blobs === 1 ? rand(-0.08, 0.08) * cl : (b ? 1 : -1) * cl * 0.2;
              e.ellipse(bx, rand(-0.1, 0.1) * ch, cl * (blobs === 1 ? 0.3 : 0.17), ch * 0.32, rand(-0.3, 0.3), 0, TAU);
              g.fillStyle = hsla(chl, 75, 45, 0.6); g.fill(e);
            }
            const dd = new Path2D();
            for (let j = 0; j < 6; j++) dot(dd, rand(-0.4, 0.4) * cl, rand(-0.35, 0.35) * ch, Math.min(cl, ch) * 0.05);
            g.fillStyle = hsla(chl, 80, 70, 0.6); g.fill(dd);
            g.restore();
            rim(g, c, h, 1.4, 6);
            g.restore();
          }
        } };
      },
    });
  
    const FORM_WEIGHTS = [
      ['centric', 13], ['polygon', 11], ['radial', 9], ['star', 5], ['pennate', 5], ['chain', 3],
      ['stellate', 9], ['triradiate', 6], ['lemon', 8], ['waisted', 5], ['rod', 5], ['nodose', 4],
      ['crescent', 4], ['sigmoid', 4], ['surirella', 5], ['lobed', 6], ['ring', 4], ['girdle', 6], ['filament', 7],
    ];
    const MIN_FOR = { pennate: 55, chain: 55, rod: 80, nodose: 70, sigmoid: 80, crescent: 55, filament: 95,
                      girdle: 50, triradiate: 50, lemon: 45, waisted: 50, surirella: 45 };
    function pickForm(R) {
      let total = 0; for (const [, w] of FORM_WEIGHTS) total += w;
      for (let tries = 0; tries < 30; tries++) {
        let x = Math.random() * total;
        for (const [f, w] of FORM_WEIGHTS) {
          if ((x -= w) <= 0) { if (R >= (MIN_FOR[f] || 0)) return f; break; }
        }
      }
      return 'centric';
    }

    // ---------- Engine for the strip ----------
    const LEVELS = 5, BLUR_MAX = 64;
    const FILTER_OK = (() => {
      const g = document.createElement('canvas').getContext('2d');
      if (!('filter' in g)) return false;
      g.filter = 'blur(1px)';
      return g.filter === 'blur(1px)';
    })();
    function blurLevels(cv, inner) {
      const levels = [cv];
      let src = cv;
      for (let i = 1; i <= LEVELS; i++) {
        const c = document.createElement('canvas');
        c.width = Math.max(2, Math.ceil(src.width / 2)); c.height = Math.max(2, Math.ceil(src.height / 2));
        const g = c.getContext('2d');
        if (FILTER_OK) g.filter = 'blur(1px)';
        g.drawImage(src, 0, 0, c.width, c.height);
        g.filter = 'none';
        g.globalCompositeOperation = 'destination-in';
        const rr = c.width / 2;
        const m = g.createRadialGradient(rr, rr, rr * inner, rr, rr, rr * 0.995);
        m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = m; g.fillRect(0, 0, c.width, c.height);
        levels.push(c); src = c;
      }
      return levels;
    }

    const cv = stage.canvas('mix-blend-mode:plus-lighter');
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, dpr = 1, full = false;
    let ws = 1, WW = 1920, WH = 1080, K = 1, sprScale = 1;   // world→css scale, world size, device scale
    let MIN_R = 30, MAX_R = 200, countScale = 1;
    let specimens = [], silt = [], t = 0, nextSpawn = 0.2, seeded = false;
    const LEVEL_COUNTS = [38, 62, 90, 122, 158];
    let level = 1, popFrom = 0, popTo = 0, popT0 = 0, fade = 1.5;
    const DEPTHS = [0.12, 0.38, 0.62, 0.88];
    let focus = DEPTHS[1], fFrom = focus, fTo = focus, fT = 1, fDur = 3, fHold = 6;
    const easeIO3 = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

    function configure() {
      if (full) {
        // The original microscope field, scaled so its height fills the screen
        ws = H / 1080; MIN_R = 30; MAX_R = 200; fade = 5;
        WW = W / ws; WH = 1080; countScale = WW * WH / (1920 * 1080);
      } else {
        // Strip: the largest specimen nearly fills the band's height
        WH = 330; ws = H / WH; MIN_R = 45; MAX_R = 150; fade = 1.5;
        WW = W / ws; countScale = WW * WH / (1920 * 1080) * 0.55;
      }
      K = ws * dpr;
      sprScale = Math.min(2, Math.max(0.12, K));
      silt = Array.from({ length: Math.round(140 * countScale) }, () => [rand(0, WW), rand(0, WH), rand(0.4, 1.4) / ws * (full ? 1 : 0.35), rand(0.05, 0.22)]);
    }
    const countFor = n => Math.max(6, Math.round(LEVEL_COUNTS[n - 1] * countScale));
    function popTarget() {
      const u = Math.max(0, Math.min(1, (t - popT0) / fade));
      return popFrom + (popTo - popFrom) * (u * u * (3 - 2 * u));
    }
    function setLevel(n) {
      n = Math.max(1, Math.min(5, n));
      if (n === level && popTo === countFor(n)) return;
      popFrom = popTarget(); popTo = countFor(n); popT0 = t; level = n;
    }
    function updateFocus(dt) {
      if (fT < 1) {
        fT = Math.min(1, fT + dt / fDur);
        focus = fFrom + (fTo - fFrom) * easeIO3(fT);
        if (fT >= 1) fHold = rand(4, 9);
      } else {
        fHold -= dt;
        if (fHold <= 0) {
          fFrom = focus;
          let nxt; do { nxt = pick(DEPTHS); } while (Math.abs(nxt - focus) < 0.05);
          fTo = nxt; fT = 0; fDur = rand(2.2, 3.6) * (0.7 + Math.abs(fTo - fFrom));
        }
      }
    }
    function makeSprite(R, form) {
      const pad = 52;
      const size = Math.max(4, Math.ceil((2 * R + 2 * pad) * sprScale));
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const g = c.getContext('2d');
      g.setTransform(sprScale, 0, 0, sprScale, size / 2, size / 2);
      form.draw(g);
      return { half: R + pad, levels: blurLevels(c, (R + 8) / (R + pad)) };
    }
    function spawn(now) {
      const maxR = MAX_R * (1 - 0.08 * (level - 1));
      const R = MIN_R + (maxR - MIN_R) * Math.pow(Math.random(), 1.7);
      const h = hueFor();
      const form = FORMS[pickForm(R)](R, h);
      const nimble = Math.sqrt(70 / R);
      const speed = rand(4, 20) * nimble, dir = rand(0, TAU);
      specimens.push({
        x: rand(0, WW), y: full ? rand(0, WH) : rand(R * 0.9, WH - R * 0.9), R,
        z: pick(DEPTHS) + rand(-0.05, 0.05),
        sprite: makeSprite(R, form),
        vx: Math.cos(dir) * speed, vy: Math.sin(dir) * speed * (full ? 1 : 0.25),
        ang: rand(0, TAU), spin: (Math.random() < 0.5 ? -1 : 1) * rand(0.01, 0.15) * nimble,
        born: now, fadeIn: rand(3, 5) * (full ? 1 : 0.6), life: rand(25, 60), fadeOut: rand(4, 6)
      });
    }

    return {
      resize(w, h, d, isFull) {
        const changed = isFull !== full || d !== dpr || h !== H;
        W = w; H = h; dpr = d; full = isFull;
        cv.width = W * dpr; cv.height = H * dpr;
        configure();
        if (changed || !seeded) { specimens = []; seeded = false; }
      },
      step(dtMs, lv, still) {
        const dt = Math.min(0.1, dtMs / 1000);
        // Activity: 1 when the page is still, up to 5 when scrolling hard
        setLevel(1 + Math.round(Math.min(1, lv) * 4));
        const speedMult = still ? 0 : 1 + 1.5 * Math.min(1, lv);
        t += dt;
        if (!seeded) {
          seeded = true;
          popFrom = popTo = countFor(level); popT0 = t;
          // Arrive with a field already in view, at mixed ages
          for (let i = 0; i < popTo; i++) { spawn(t); const s = specimens[specimens.length - 1]; s.born -= rand(s.fadeIn, s.fadeIn + s.life * 0.6); }
        }
        const want = popTarget(), changing = t - popT0 < fade;
        let alive = 0; for (const s of specimens) if (!s.dying) alive++;
        if (alive < want - 0.5 && (changing || t >= nextSpawn)) { spawn(t); nextSpawn = t + rand(0.15, 0.6); }
        else if (alive > want + 0.5) {
          const pool = specimens.filter(s => !s.dying);
          const s = pool[Math.floor(Math.random() * pool.length)];
          if (s) { s.retire = t; s.dying = true; }
        }
        if (!still) updateFocus(dt);
        for (const s of specimens) {
          s.ang += s.spin * dt * speedMult;
          s.x += s.vx * dt * speedMult; s.y += s.vy * dt * speedMult;
          const m = s.R + 30;
          if (s.x < -m) s.x += WW + 2 * m; else if (s.x > WW + m) s.x -= WW + 2 * m;
          if (full) { if (s.y < -m) s.y += WH + 2 * m; else if (s.y > WH + m) s.y -= WH + 2 * m; }
          else if ((s.y < s.R * 0.9 && s.vy < 0) || (s.y > WH - s.R * 0.9 && s.vy > 0)) s.vy = -s.vy;   // stay inside the strip
        }

        ctx.setTransform(K, 0, 0, K, 0, 0);
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
        ctx.clearRect(0, 0, WW, WH);
        ctx.fillStyle = '#9fd8e8';
        for (const [x, y, r, a] of silt) { ctx.globalAlpha = a; ctx.fillRect(x, y, r, r); }
        ctx.globalCompositeOperation = 'lighter';
        for (let i = specimens.length - 1; i >= 0; i--) {
          const s = specimens[i], age = t - s.born;
          let a;
          if (age < s.fadeIn) a = age / s.fadeIn;
          else if (age < s.fadeIn + s.life) a = 1;
          else { a = 1 - (age - s.fadeIn - s.life) / s.fadeOut; s.dying = true; }
          if (s.retire !== undefined) a = Math.min(a, (age < s.fadeIn ? age / s.fadeIn : 1) * (1 - (t - s.retire) / (full ? 2.5 : 1.2)));
          if (s.dying && a <= 0) { specimens.splice(i, 1); continue; }
          if (a <= 0) continue;
          a = a * a * (3 - 2 * a);
          const d = Math.abs(s.z - focus);
          const grow = (0.94 + 0.06 * Math.min(1, age / s.fadeIn)) * (1 + 0.05 * Math.min(1, d / 0.5));
          const c = Math.cos(s.ang) * grow, sn = Math.sin(s.ang) * grow;
          ctx.setTransform(K * c, K * sn, -K * sn, K * c, K * s.x, K * s.y);
          const blurPx = Math.max(0, d - 0.015) * BLUR_MAX * sprScale;
          const lvB = Math.min(LEVELS, Math.log2(1 + blurPx));
          const l0 = Math.min(LEVELS, Math.floor(lvB)), fr = lvB - l0;
          const dim = 1 - 0.4 * Math.min(1, d / 0.55);
          const half = s.sprite.half, lev = s.sprite.levels;
          ctx.globalAlpha = a * dim * (1 - fr);
          ctx.drawImage(lev[l0], -half, -half, half * 2, half * 2);
          if (fr > 0.01 && l0 < LEVELS) { ctx.globalAlpha = a * dim * fr; ctx.drawImage(lev[l0 + 1], -half, -half, half * 2, half * 2); }
        }
        ctx.globalAlpha = 1;
      }
    };
  }


  /* ================= Choosing a band ================= */
  const BANDS = { bokeh: bokehBand, hexagons: hexBand, lights: lightsBand, diatoms: diatomBand };
  function choose() {
    const names = Object.keys(BANDS);
    const forced = new URLSearchParams(location.search).get('band');
    if (forced && BANDS[forced]) return forced;
    let prev = null;
    try { prev = localStorage.getItem('tl-band'); } catch (e) {}
    // Shuffle-bag: a random order of all bands, each shown once before reshuffling
    let bag = [];
    try { bag = JSON.parse(localStorage.getItem('tl-band-bag') || '[]').filter(n => BANDS[n]); } catch (e) {}
    if (!bag.length) {
      bag = names.slice();
      for (let j = bag.length - 1; j > 0; j--) { const r = Math.floor(Math.random() * (j + 1)); [bag[j], bag[r]] = [bag[r], bag[j]]; }
      if (bag.length > 1 && bag[0] === prev) bag.push(bag.shift());
    }
    const pick = bag.shift();
    try { localStorage.setItem('tl-band-bag', JSON.stringify(bag)); } catch (e) {}
    try { localStorage.setItem('tl-band', pick); } catch (e) {}
    return pick;
  }

  /* ================= Shared frame: placement, glass, scroll energy ================= */
  function findHeader() {
    const marked = document.querySelector('[data-bokeh-anchor]');
    if (marked) return marked;
    return [...document.querySelectorAll('body *')].filter(el => {
      const cs = getComputedStyle(el);
      if (cs.position !== 'fixed' && cs.position !== 'sticky') return false;
      const r = el.getBoundingClientRect();
      return r.top <= 2 && r.width > innerWidth * 0.6 && r.height > 0 && r.height < innerHeight / 2;
    }).sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0] || null;
  }
  function pageBg() {
    for (const el of [document.body, document.documentElement]) { const c = getComputedStyle(el).backgroundColor; if (!isClear(c)) return c; }
    return 'rgb(16,16,16)';
  }

  function init() {
    const header = findHeader();
    const hs = header ? getComputedStyle(header) : null;
    const menuAlpha = hs ? nums(hs.backgroundColor)[3] : undefined;
    const OPACITY = S.BAND_OPACITY ?? (menuAlpha !== undefined && menuAlpha < 1 ? menuAlpha : 0.85);
    const menuBlur = hs && hs.backdropFilter && hs.backdropFilter !== 'none' ? hs.backdropFilter : null;
    const BLUR = S.BAND_BLUR ?? menuBlur ?? 'blur(8px)';
    const solid = Math.round((1 - S.FEATHER) * 100), mid = Math.round(solid + (100 - solid) * 0.5);
    const fade = `linear-gradient(to bottom, #000 0%, #000 ${solid}%, rgba(0,0,0,.55) ${mid}%, transparent 100%)`;

    const z = hs ? (parseInt(hs.zIndex) || 1000) : 1000;
    const band = document.createElement('div');
    band.style.cssText = `position:fixed;left:0;right:0;height:${S.BAND_HEIGHT}px;overflow:hidden;z-index:${z};pointer-events:none`;
    const glass = document.createElement('div');
    glass.setAttribute('aria-hidden', 'true');
    glass.style.cssText = `position:absolute;inset:0;backdrop-filter:${BLUR};-webkit-backdrop-filter:${BLUR};mask-image:${fade};-webkit-mask-image:${fade}`;
    band.appendChild(glass);
    document.body.appendChild(band);

    const spacer = document.createElement('div');
    spacer.setAttribute('aria-hidden', 'true');
    spacer.style.height = S.BAND_HEIGHT + 'px';
    if (header) header.after(spacer); else document.body.prepend(spacer);

    let hidden = false;
    function applyColors() {
      const [r, g, b] = nums(pageBg());
      hidden = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.5;
      band.style.display = spacer.style.display = hidden ? 'none' : '';
      glass.style.background = `rgba(${r},${g},${b},${OPACITY})`;
    }
    applyColors();
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyColors);
    const mo = new MutationObserver(applyColors);
    mo.observe(document.documentElement, { attributes: true });
    mo.observe(document.body, { attributes: true });

    // Full-screen button (hidden where the browser can't show an element full screen, e.g. iPhone)
    const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
    const canFull = S.FULLSCREEN_BUTTON && !!(band.requestFullscreen || band.webkitRequestFullscreen) && (document.fullscreenEnabled || document.webkitFullscreenEnabled);
    const ICON_OPEN = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>';
    const ICON_CLOSE = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/></svg>';
    const fsBtn = document.createElement('button');
    fsBtn.type = 'button';
    fsBtn.setAttribute('aria-label', 'View animation full screen');
    fsBtn.title = 'Full screen';
    fsBtn.innerHTML = ICON_OPEN;
    fsBtn.style.cssText = 'position:absolute;right:max(10px, env(safe-area-inset-right, 0px));top:50%;transform:translateY(-50%);width:28px;height:28px;display:flex;align-items:center;justify-content:center;padding:0;border:1px solid rgba(238,234,224,.18);border-radius:999px;background:rgba(10,10,12,.35);color:rgba(238,234,224,.5);cursor:pointer;pointer-events:auto;z-index:2;transition:color .2s,border-color .2s,opacity .6s';
    fsBtn.onmouseenter = () => { fsBtn.style.color = 'rgba(238,234,224,.95)'; fsBtn.style.borderColor = 'rgba(238,234,224,.5)'; };
    fsBtn.onmouseleave = () => { fsBtn.style.color = 'rgba(238,234,224,.5)'; fsBtn.style.borderColor = 'rgba(238,234,224,.18)'; };
    fsBtn.onclick = () => {
      if (fsEl()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else { const p = (band.requestFullscreen || band.webkitRequestFullscreen).call(band); if (p && p.catch) p.catch(() => {}); }
    };
    if (canFull) band.appendChild(fsBtn);
    let full = false, idleTimer;
    function wake() {
      fsBtn.style.opacity = '1';
      clearTimeout(idleTimer);
      if (full) idleTimer = setTimeout(() => { fsBtn.style.opacity = '0'; }, 2500);
    }
    function onFullChange() {
      full = fsEl() === band;
      fsBtn.innerHTML = full ? ICON_CLOSE : ICON_OPEN;
      fsBtn.setAttribute('aria-label', full ? 'Exit full screen' : 'View animation full screen');
      fsBtn.title = full ? 'Exit full screen (Esc)' : 'Full screen';
      glass.style.display = full ? 'none' : '';
      fsBtn.style.top = full ? '20px' : '50%';
      fsBtn.style.right = full ? '20px' : 'max(10px, env(safe-area-inset-right, 0px))';
      fsBtn.style.transform = full ? 'none' : 'translateY(-50%)';
      band.style.background = full ? '#000' : '';
      band.style.cursor = full ? 'none' : '';
      band.style.pointerEvents = full ? 'auto' : 'none';
      W = H = 0;   // force a resize into the new mode
      wake();
      if (reduce) requestAnimationFrame(frame);
    }
    document.addEventListener('fullscreenchange', onFullChange);
    document.addEventListener('webkitfullscreenchange', onFullChange);
    band.addEventListener('mousemove', () => { if (full) { band.style.cursor = ''; wake(); clearTimeout(band._c); band._c = setTimeout(() => { if (full) band.style.cursor = 'none'; }, 2500); } });

    const stage = {
      canvas(css) {
        const c = document.createElement('canvas');
        c.setAttribute('aria-hidden', 'true');
        c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;' + css;
        band.insertBefore(c, fsBtn.parentNode === band ? fsBtn : null);
        return c;
      }
    };
    const name = choose();
    band.dataset.band = name;
    const viz = BANDS[name](stage);

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, last = performance.now(), lastY = scrollY, energy = 0, build = 0, level = 0, levelV = 0, clock = 0;
    function place() { band.style.top = (header ? Math.max(0, header.getBoundingClientRect().bottom) : 0) + 'px'; }

    function frame(t) {
      const dt = Math.min(50, t - last); last = t;
      clock += dt;
      if (!hidden || full) {
        if (!full) place();
        if (band.clientWidth !== W || band.clientHeight !== H) { W = band.clientWidth; H = band.clientHeight; viz.resize(W, H, Math.min(devicePixelRatio || 1, full ? 2 : 3), full); }
        const vel = Math.abs(scrollY - lastY) / Math.max(dt, 1) * 1000; lastY = scrollY;
        const target = Math.min(1, vel / S.SCROLL_SENSITIVITY);
        energy += (target - energy) * (1 - Math.exp(-dt / (target > energy ? 60 : 250)));
        build = Math.min(1, Math.max(0, build + (energy > .05 ? dt / S.SCROLL_BUILDUP : -dt / S.SCROLL_SETTLE)));
        const raw = energy * (.35 + .65 * build);
        const steps = Math.ceil(dt / 4), h = dt / steps;
        for (let i = 0; i < steps; i++) {
          const w = 6.6 / (raw > level ? S.SCROLL_RESPONSE * 2 : S.SCROLL_SETTLE);
          levelV += (w * w * (raw - level) - 2 * w * levelV) * h;
          level = Math.max(0, Math.min(1.2, level + levelV * h));
        }
        // Full screen has no scrolling, so it breathes gently between calm and lively instead
        const lv = full ? 0.22 + 0.18 * Math.sin(clock / 24000 * Math.PI * 2) : level;
        viz.step(dt, lv, reduce);
      }
      if (!reduce) requestAnimationFrame(frame);
    }
    addEventListener('scroll', place, { passive: true });
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
