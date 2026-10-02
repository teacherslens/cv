/* Bokeh band for teacherslens.com
   Scroll-reactive bokeh under the fixed menu.
   Load with: <script src="/bokeh-band.js" defer></script>
   Optional: add data-bokeh-anchor to the menu element to pin the band under it. */
(() => {
  const S = {
    BAND_HEIGHT: 53,          // band height in px
    FILL_SOFTNESS: 2.2,       // blur on the glow, in px
    RIM_SHARPNESS: 0.55,      // crisp rim strength (0–1)
    TEXT_GLOW: 0.5,           // how much content brightens the balls (0–1)
    FEATHER: 0.85,            // share of the band that fades, 0–1
    BAND_OPACITY: null,       // null = match the menu; or 0–1
    BAND_BLUR: null,          // null = match the menu; or e.g. 'blur(8px)'
    REST_BALLS: 8,            // balls present when not scrolling
    REST_SPEED: 0.15,         // movement when not scrolling
    SCROLL_SPEEDUP: 12,       // speed multiple at full momentum
    SCROLL_EXTRA: 45,         // extra balls at full momentum
    SCROLL_SENSITIVITY: 1000, // scroll speed (px/s) that counts as full energy
    SCROLL_RESPONSE: 150,     // ms to react when scrolling starts
    SCROLL_BUILDUP: 2500,     // ms of continuous scrolling to reach full momentum
    SCROLL_SETTLE: 3500       // ms to glide back to rest after scrolling stops
  };

  const nums = c => (c.match(/[\d.]+/g) || []).map(Number);
  const isClear = c => !c || c === 'transparent' || c === 'rgba(0, 0, 0, 0)';

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

    const solid = Math.round((1 - S.FEATHER) * 100);
    const mid = Math.round(solid + (100 - solid) * 0.5);
    const fade = `linear-gradient(to bottom, #000 0%, #000 ${solid}%, rgba(0,0,0,.55) ${mid}%, transparent 100%)`;

    const z = hs ? (parseInt(hs.zIndex) || 1000) : 1000;
    const band = document.createElement('div');
    band.setAttribute('aria-hidden', 'true');
    band.style.cssText = `position:fixed;left:0;right:0;height:${S.BAND_HEIGHT}px;overflow:hidden;z-index:${z};pointer-events:none`;
    const glass = document.createElement('div');
    glass.style.cssText = `position:absolute;inset:0;backdrop-filter:${BLUR};-webkit-backdrop-filter:${BLUR};mask-image:${fade};-webkit-mask-image:${fade}`;
    const mk = css => { const c = document.createElement('canvas'); c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;' + css; return c; };
    const cd = mk(`filter:blur(${S.FILL_SOFTNESS}px);mix-blend-mode:color-dodge`);
    const cf = mk(`filter:blur(${S.FILL_SOFTNESS}px);mix-blend-mode:plus-lighter`);
    const cr = mk('mix-blend-mode:plus-lighter');
    band.append(glass, cd, cf, cr);
    document.body.appendChild(band);

    const spacer = document.createElement('div');
    spacer.setAttribute('aria-hidden', 'true');
    spacer.style.height = S.BAND_HEIGHT + 'px';
    if (header) header.after(spacer); else document.body.prepend(spacer);

    // Match the page color; hide on light pages, where the glow can't work
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

    const xd = cd.getContext('2d'), xf = cf.getContext('2d'), xr = cr.getContext('2d');
    const layers = [[cd, xd], [cf, xf], [cr, xr]];
    let balls = [], nextSpawn = 0, nextSurge = 0, last = performance.now(), W = 0, H = S.BAND_HEIGHT, clock = 0;
    let lastY = scrollY, energy = 0, build = 0, level = 0, levelV = 0;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    function place() { band.style.top = (header ? Math.max(0, header.getBoundingClientRect().bottom) : 0) + 'px'; }
    function size() {
      const dpr = devicePixelRatio || 1; W = band.clientWidth; H = band.clientHeight;
      for (const [c, x] of layers) { c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); }
    }
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
    function frame(t) {
      const dt = Math.min(50, t - last); last = t;
      if (!hidden) {
        place(); if (band.clientWidth !== W) size();
        clock += dt;
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
        const base = balls.filter(b => !b.surge).length, surge = balls.length - base;
        if (clock > nextSpawn && base < S.REST_BALLS) { spawn(); nextSpawn = clock + 800 + Math.random() * 2000; }
        if (level > .03 && clock > nextSurge && surge < level * S.SCROLL_EXTRA) { spawn(true); nextSurge = clock + (30 + Math.random() * 120) / (.3 + level); }
        const mult = S.REST_SPEED + level * (S.SCROLL_SPEEDUP - S.REST_SPEED);
        balls.forEach(b => b.x -= b.v * mult * dt / 1000);
        balls = balls.filter(b => b.x > -b.h * 2 && clock - b.born < b.life && !(b.surge && level < .01));
        draw();
      }
      if (!reduce) requestAnimationFrame(frame);
    }

    place(); size();
    for (let k = 0; k < S.REST_BALLS; k++) { spawn(); balls[balls.length - 1].born -= 1400 + Math.random() * 4000; }
    addEventListener('scroll', place, { passive: true });
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
