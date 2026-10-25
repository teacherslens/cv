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
    HEX_SIZE: null,           // hexagon radius in px; null = fit two full rows in the band
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
    const cv = stage.canvas('mix-blend-mode:screen');
    const ctx = cv.getContext('2d');
    const INK = '238,234,224';
    let R = 15, HW = 0, ROW = 0, s = 0, top = 0;
    const easeIO = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const smooth = t => t * t * (3 - 2 * t);
    const V = [];

    let W = 0, H = 0, dpr = 1, grid = [], visible = [], t = 0, nextSpawn = 0.3, maxPencils = 6, started = false;
    const dust = [];

    function build() {
      // Two complete rows: total height of two interlocking pointy-top rows is 3.5 × radius
      const margin = 2.5;
      R = S.HEX_SIZE ?? Math.max(8, (H - 2 * margin) / 3.5);
      HW = Math.sqrt(3) * R; ROW = 1.5 * R; s = R / 66;
      top = (H - 3.5 * R) / 2;
      V.length = 0;
      for (let i = 0; i < 6; i++) { const a = (-90 + 60 * i) * Math.PI / 180; V.push([R * Math.cos(a), R * Math.sin(a)]); }
      grid = [];
      const all = [];
      const rows = 2, cols = Math.ceil(W / HW) + 2;
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
    function onScreen(c) { return c.cx > -HW * 0.3 && c.cx < W + HW * 0.3; }
    function neighbors(c) {
      const d = (c.r & 1) ?
