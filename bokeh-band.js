/* Visual band for teacherslens.com
   An animated strip under the fixed menu. Each page load shows a different visualization.
   Load with: <script src="bokeh-band.js" defer></script>
   Preview a specific one: teacherslens.com/?band=bokeh  or  ?band=hexagons
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
    HEX_SIZE: 17,             // hexagon radius in px
    HEX_BRIGHTNESS: 1         // pencil brightness multiplier
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
    let balls = [], nextSpawn = 0, nextSurge = 0, W = 0, H = 0, clock = 0, seeded = false, level = 0;

    const life = () => Math.random() < .4 ? 2500 + Math.random() * 3500 : 9000 + Math.random() * 18000;
    const speed = () => { const q = Math.random(); return q < .6 ? 1.5 + Math.random() * 4 : q < .9 ? 5 + Math.random() * 6 : 12 + Math.random() * 10; };
    const one = (x, y, h, v, delay, surge) => balls.push({ x, y, h, v, surge, born: clock + delay, life: life(), a: .15 + Math.random() * .11 });
    function spawn(surge = false) {
      const h = H * (.27 + Math.random() * .15), y = h + 3 + Math.random() * Math.max(0, H - 2 * h - 6), x = Math.random() * W * 1.08;
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
      resize(w, h, dpr) {
        W = w; H = h;
        for (const [c, x] of layers) { c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); }
      },
      step(dt, lv) {
        level = lv; clock += dt;
        if (!seeded) { seeded = true; for (let k = 0; k < S.REST_BALLS; k++) { spawn(); balls[balls.length - 1].born -= 1400 + Math.random() * 4000; } }
        const base = balls.filter(b => !b.surge).length, surge = balls.length - base;
        if (clock > nextSpawn && base < S.REST_BALLS) { spawn(); nextSpawn = clock + 800 + Math.random() * 2000; }
        if (level > .03 && clock > nextSurge && surge < level * S.SCROLL_EXTRA) { spawn(true); nextSurge = clock + (30 + Math.random() * 120) / (.3 + level); }
        const mult = S.REST_SPEED + level * (S.SCROLL_SPEEDUP - S.REST_SPEED);
        balls.forEach(b => b.x -= b.v * mult * dt / 1000);
        balls = balls.filter(b => b.x > -b.h * 2 && clock - b.born < b.life && !(b.surge && level < .01));
        draw();
      }
    };
  }

  /* ================= Sketched hexagons ================= */
  function hexBand(stage) {
    const edgeFade = 'linear-gradient(to bottom, transparent 0%, #000 22%, #000 68%, transparent 100%)';
    const cv = stage.canvas(`mix-blend-mode:screen;mask-image:${edgeFade};-webkit-mask-image:${edgeFade}`);
    const ctx = cv.getContext('2d');
    const INK = '238,234,224';
    const R = S.HEX_SIZE, HW = Math.sqrt(3) * R, ROW = 1.5 * R, s = R / 66;
    const easeIO = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const smooth = t => t * t * (3 - 2 * t);
    const V = [];
    for (let i = 0; i < 6; i++) { const a = (-90 + 60 * i) * Math.PI / 180; V.push([R * Math.cos(a), R * Math.sin(a)]); }

    let W = 0, H = 0, dpr = 1, grid = [], visible = [], t = 0, nextSpawn = 0.3, maxPencils = 6, started = false;
    const dust = [];

    function build() {
      grid = [];
      const all = [];
      const rows = Math.ceil(H / ROW) + 2, cols = Math.ceil(W / HW) + 2;
      for (let r = 0; r < rows; r++) {
        grid[r] = [];
        for (let q = 0; q < cols; q++) {
          const cell = { r, q, cx: q * HW + (r & 1 ? HW / 2 : 0) - HW / 2, cy: r * ROW - ROW / 2, state: 'empty', div: 0 };
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
      const os = o.overshoot || 0;
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
      return { pts, cum, len: L, width: o.width, alpha: o.alpha * S.HEX_BRIGHTNESS, gaps: o.gaps || 0, delay: o.delay, dur: Math.max(0.05, L / (o.speed * s * 1.2)) };
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
          const segs = hatchSegments(poly, h.ang, h.gap);
          if (Math.random() < 0.5) segs.reverse();
          segs.forEach((sg, j) => L.push(makeStroke(sg[0], sg[1], {
            width: rand(0.42, 0.6), alpha: h.alpha * rand(0.8, 1.15), speed: rand(650, 950), bow: 0.6, gaps: 0.05,
            delay: j === 0 ? rand(0.25, 0.5) : rand(0.025, 0.07)
          })));
        });
      }
      return L;
    }
    const PAD = 5;
    function startCell(cell) {
      const bw = HW + 2 * PAD + 8, bh = 2 * R + 2 * PAD + 8;
      const c = document.createElement('canvas');
      c.width = Math.ceil(bw * dpr); c.height = Math.ceil(bh * dpr);
      const g = c.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, bw * dpr / 2, bh * dpr / 2);
      g.lineCap = 'round';
      Object.assign(cell, { state: 'drawing', cv: c, g, bw, bh, strokes: planStrokes(cell), si: 0, st: 0, drawn: 0, alpha: 1 });
    }
    function drawPiece(g, st, l0, l1) {
      const step = 1.2;
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
        g.strokeStyle = `rgba(0,0,0,${rand(0.25, 0.8)})`; g.lineWidth = rand(0.8, 2.6); g.lineCap = 'round';
        g.beginPath(); g.moveTo(x, y);
        g.quadraticCurveTo(x + rand(-3, 3), y + rand(-3, 3), x + rand(-5, 5), y + rand(-5, 5)); g.stroke();
        if (Math.random() < 0.12) dust.push({ x: cell.cx + x, y: cell.cy + y, vx: rand(-2, 2), vy: rand(1, 5), born: t, life: rand(1.2, 2.8), size: rand(0.4, 1), a: rand(0.25, 0.6) });
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
      resize(w, h, d) {
        const rebuild = w !== W || h !== H || d !== dpr;
        W = w; H = h; dpr = d;
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
        for (const d of dust) { d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 2 * dt; }
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

  /* ================= Choosing a band ================= */
  const BANDS = { bokeh: bokehBand, hexagons: hexBand };
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
    band.setAttribute('aria-hidden', 'true');
    band.style.cssText = `position:fixed;left:0;right:0;height:${S.BAND_HEIGHT}px;overflow:hidden;z-index:${z};pointer-events:none`;
    const glass = document.createElement('div');
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

    const stage = {
      canvas(css) {
        const c = document.createElement('canvas');
        c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;' + css;
        band.appendChild(c);
        return c;
      }
    };
    const name = choose();
    band.dataset.band = name;
    const viz = BANDS[name](stage);

    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, last = performance.now(), lastY = scrollY, energy = 0, build = 0, level = 0, levelV = 0;
    function place() { band.style.top = (header ? Math.max(0, header.getBoundingClientRect().bottom) : 0) + 'px'; }

    function frame(t) {
      const dt = Math.min(50, t - last); last = t;
      if (!hidden) {
        place();
        if (band.clientWidth !== W || band.clientHeight !== H) { W = band.clientWidth; H = band.clientHeight; viz.resize(W, H, devicePixelRatio || 1); }
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
        viz.step(dt, level, reduce);
      }
      if (!reduce) requestAnimationFrame(frame);
    }
    addEventListener('scroll', place, { passive: true });
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
