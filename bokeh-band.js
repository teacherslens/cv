/* Visual band for teacherslens.com
   An animated strip under the fixed menu. Each page load shows a different visualization.
   Load with: <script src="bokeh-band.js" defer></script>
   Preview a specific one: teacherslens.com/?band=bokeh, ?band=hexagons or ?band=lights
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

  /* ================= Choosing a band ================= */
  const BANDS = { bokeh: bokehBand, hexagons: hexBand, lights: lightsBand };
  function choose() {
    const names = Object.keys(BANDS);
    const forced = new URLSearchParams(location.search).get('band');
    if (forced && BANDS[forced]) return forced;
    let prev = null;
    try { prev = localStorage.getItem('tl-band'); } catch (e) {}
    const pool = names.filter(n => n !== prev);
    const pick = pool[Math.floor(Math.random() * pool.length)] || names[0];
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
