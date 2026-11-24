/* Short and long views for teacherslens.com
   Maintained ONLY in the GitHub repo (like bokeh-band.js); build.sh never overwrites it.

   What it does
   - Standards strip under the menu bar: the seven PTC principal standards in muted colours,
     each opening that standard's evidence folder in Google Drive.
   - Short view (default): loads short-cv.html, the two-page role resume rendered from the same
     data as the PDF. The long view is the page build.sh generates.
   - Toggle between the two in the menu bar; ?view=long opens the long view directly.
   - Downloads: the menu bar's button follows the view (icon only on phones); the closing section
     has both the short and long PDF.
   - Hero bar (23 Nov 2026): one row under the contact lines, across the full width, with the
     Short/Long toggle, the two PDF downloads and the colour-key note, spaced evenly between the
     contact lines and the hero's bottom rule.
   - Long view: adds the same evidence tags and links as the short view.
   - Every web link and PDF opens in a new tab (in-page anchors and email links stay as they are).
   - Hero title line: TAGLINE in both views (set 23 Nov 2026; replaces the role title from short-cv.html
     and the generated long-view tagline, so a rebuild of either doesn't bring them back).

   Loaded by: <script src="resume-views.js" defer></script> in index.html. bokeh-band.js also
   loads it if a rebuilt index.html leaves that line out. */
(() => {
  if (window.__resumeViews) return;
  window.__resumeViews = true;

  const C = {
    SHORT_HTML: 'short-cv.html',
    SHORT_PDF: 'chris-davis-resume-elementary-principal.pdf',
    LONG_PDF: 'chris-davis-cv.pdf',
    FOLDER: 'https://drive.google.com/drive/folders/',
    FILE: 'https://drive.google.com/file/d/',
  };

  // Seven PTC Standards for International School Principals. fill = muted strip colour for the dark theme;
  // tint = readable text colour on the page background (contrast ≥ 5.3:1); chip = number-tag fill.
  const STD = [
    { n: 1, label: 'Student Progress',   short: 'Progress',    folder: '1RhweO3O8G_fAiRGP8hOd8IclfBcL5ocE', fill: '#1A2B44', tint: '#7E92AE', chip: '#1D375E' },
    { n: 2, label: 'Global Citizenship', short: 'Citizenship', folder: '1EOPZQl23rRFBkGNAGy8HjiDq9dO6CyNv', fill: '#214726', tint: '#6A9E6E', chip: '#27632F' },
    { n: 3, label: 'Talent',             short: 'Talent',      folder: '1Ui9Kw3jY-ulv_D1zSNB2qxSqmuj1kHBk', fill: '#422C5B', tint: '#A086B9', chip: '#59367F' },
    { n: 4, label: 'Curriculum',         short: 'Curriculum',  folder: '1Ufae936hcAOILazPDD0J8UI0y4gfkz1w', fill: '#4D3017', tint: '#B08A66', chip: '#6C3F17' },
    { n: 5, label: 'Operations',         short: 'Operations',  folder: '1CS41nhCeDn6cWyb02OeDA28bB35K0R_c', fill: '#18404F', tint: '#62999F', chip: '#19586E' },
    { n: 6, label: 'Learning Culture',   short: 'Culture',     folder: '1jmIqMm11DtgnzXPuP9mAfZxUr2QhnM7b', fill: '#461D2A', tint: '#B0838D', chip: '#612135' },
    { n: 7, label: 'Transition',         short: 'Transition',  folder: '1G7s3jzGM-36elRybJZQdMm55hrZU8HcQ', fill: '#602B53', tint: '#BF7AA9', chip: '#883473' },
  ];

  // Evidence PDFs (Drive file IDs) and where they attach in the long view (matched by text).
  const EV = {
    wordsTheirWay:   { n: 1, id: '1oWhw7b1_13jGIdKeN_5TIii39fYE9zHF', title: 'Words Their Way spelling inventory' },
    translanguaging: { n: 2, id: '1scV_VvzL2yImSk8vLYCPCho6pVBCrk5m', title: "Translanguaging in the writer's workshop" },
    observation:     { n: 3, id: '1ta4lmToqXWvWCMpgdrnFdrABZXNQu_lj', title: 'Strengths-based teacher observation' },
    podcasting:      { n: 3, id: '19UWgS-fzgI1NBB9kJIBM_SdWwceaRzbq', title: 'Journeys in Podcasting' },
    readingToolkit:  { n: 4, id: '1i4ZQkc4G-Rpjt9QhyH_YSaFrhWWcnysC', title: 'Student-managed reading toolkit' },
    hobbit:          { n: 4, id: '1tfmHUDHCQcznLuP0w1p3mnYXkVFDuWww', title: 'Reading forward, reading backward' },
    studio:          { n: 5, id: '1CkfEkQWq4Nw2mbIN6KAN2bOridXU_w_-', title: 'Global Learning Studio' },
    readingCulture:  { n: 6, id: '17LwwVWXAP6cfrtt9W1k4jthcy3C5F1ne', title: 'Building a reading culture' },
    letters:         { n: 6, id: '1KFb8H7U8NuxcXldgq_1p87IVcZNV8Pl7', title: 'Letters to 4.4 families' },
    firstSixWeeks:   { n: 7, id: '1nv09FMTJGdBAh-oXzKP9MZpD2RuOG5jg', title: 'The first six weeks' },
    classInMotion:   { n: 7, id: '1pRub7rQFX_Jy63uAizVhE3wxlHD6pQpw', title: 'Our Class in Motion' },
    teachersLens:    { n: 4, id: '1ALvXL_jy_uKgEvQ9pATVwpReJCnFw8PB', title: "The Teacher's Lens" },
  };
  const LONG_TAGS = [
    { sel: '.role li', text: 'Designed the full curriculum, scope, and sequence', ev: ['hobbit'] },
    { sel: '.role li', text: 'Moved every continuously enrolled middle school student', ev: ['readingCulture'] },
    { sel: '.role li', text: 'Mentor teacher and assessor for a Moreland University', ev: ['observation'] },
    { sel: '.role li', text: 'AI-supported translanguaging method', ev: ['translanguaging', 'readingToolkit'] },
    { sel: '.role li', text: 'Words Their Way', ev: ['wordsTheirWay'] },
    { sel: '.role h3', text: 'Co-Founder, Producer', ev: ['podcasting'] },
    { sel: '.role .sub', text: 'Global Learning Studio', ev: ['studio'] },
    { sel: '.role h3', text: 'Fourth Grade Teacher', ev: ['letters'] },
    { sel: '.role h3', text: 'Experiential Learning Coordinator', ev: ['firstSixWeeks', 'classInMotion'] },
    { sel: '#media h4', text: 'Class Blogs', ev: ['classInMotion', 'letters'] },
    { sel: '#media h4', text: 'First Six Weeks of School', ev: ['firstSixWeeks'] },
    { sel: '#media h4', text: 'Journeys in Podcasting', ev: ['podcasting'] },
    { sel: '#media h4', text: 'Global Learning Studio', ev: ['studio'] },
    { sel: '#media h4', text: "Teacher's Lens", ev: ['teachersLens'] },
  ];
  const IN_PROGRESS_HTML =
    '<strong>In progress</strong> — IB Certificate in Leadership Practice, Western University (to March 2027) · ' +
    '<a href="https://teacherslens.github.io/minimal-viable-classroom/index.html#model">Minimal Viable Classroom</a>' +
    '<br>Leading Recruitment in International Schools, The Principals\' Training Center for International School Leadership ' +
    '(September–November 2026); half credit toward the PTC Certificate in International School Leadership · ' +
    '<a href="https://teacherslens.github.io/meridian-dashboard/#planning">Meridian recruitment dashboard</a>';
  const SPOTIFY = 'https://open.spotify.com/show/0mg3PyAMUUHO6HxHD4oJKJ';
  const TAGLINE = 'Educator, leader, wicked problem solver';

  /* ---------------- styles ---------------- */
  const css = `
  .bar .rv-strip{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px;padding-bottom:8px}
  .bar .rv-strip a{display:flex;align-items:center;justify-content:center;gap:6px;height:24px;border-radius:3px;padding:0 4px;
    font-size:11.5px;letter-spacing:.01em;color:rgba(236,232,224,.82);white-space:nowrap;overflow:hidden;
    transition:filter .2s ease,color .2s ease}
  .bar .rv-strip a:hover,.bar .rv-strip a:focus-visible{filter:brightness(1.35) saturate(1.1);color:#fff}
  .rv-strip .n{font-weight:600;opacity:.7}
  .rv-strip .s{display:none}
  @media(max-width:900px){.rv-strip .l{display:none}.rv-strip .s{display:inline}}
  @media(max-width:600px){.rv-strip .s{display:none}.rv-strip a{font-size:11px}.rv-strip .n{opacity:.9}}

  .rv-toggle{display:inline-flex;border:1px solid var(--rule);border-radius:999px;padding:2px;gap:2px;flex:none}
  .rv-toggle button{font:500 11.5px/1 var(--sans);letter-spacing:.07em;text-transform:uppercase;color:var(--ink-dim);
    background:none;border:0;border-radius:999px;padding:7px 13px;cursor:pointer;transition:background .2s,color .2s}
  .rv-toggle button:hover{color:var(--ink)}
  .rv-toggle button[aria-pressed="true"]{background:var(--accent);color:#0b0b0d}
  .rv-bar-right{display:flex;align-items:center;gap:10px}
  .rv-bar-right .btn-sm{padding:7px 13px}
  @media(max-width:820px){.rv-bar-right .btn-sm{padding:7px 10px;gap:0}.rv-bar-right .btn-sm .dl-l{display:none}}
  body.rv-short .hero .tagline{max-width:40ch}
  .hero .meta:last-child{margin-bottom:0}
  .bar-name{white-space:nowrap}
  .rv-dl{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
  .close .rv-dl{justify-content:center}

  /* hero bar: toggle, two downloads and the colour key in one row */
  .hero{padding-top:18px;padding-bottom:40px}
  .rv-hero-bar{display:flex;flex-wrap:wrap;align-items:center;gap:12px 10px;margin-top:40px}
  .rv-hero-bar .rv-toggle button{padding:8px 13px}
  .rv-hero-bar .btn-sm{padding:8px 15px}
  .rv-hero-bar .rv-note{flex:1 1 300px;margin:0 0 0 12px;font-size:12px;line-height:1.5;color:var(--ink-faint)}
  .rv-note .sw{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:2px;vertical-align:0}
  @media(max-width:760px){
    .hero{padding-top:22px;padding-bottom:32px}
    .rv-hero-bar{margin-top:32px}
    .rv-hero-bar .rv-note{flex-basis:100%;margin:2px 0 0}
  }
  section{scroll-margin-top:100px}

  /* views */
  body.rv-loading main{opacity:0}
  main{transition:opacity .2s ease}
  body.rv-short .rv-long-part,body.rv-short .rv-nav-long{display:none!important}
  body.rv-long #rv-short,body.rv-long .rv-nav-short{display:none!important}

  /* short view content */
  #rv-short .org i{font-style:normal}
  #rv-short .rv-list{list-style:none;margin:0;padding:0}
  #rv-short .rv-list>li{position:relative;padding-left:19px;margin-bottom:10px;font-size:15px;line-height:1.66;color:var(--ink-dim)}
  #rv-short .rv-list>li::before{content:"";position:absolute;left:0;top:.68em;width:5px;height:1px;background:var(--ink-faint)}
  #rv-short .rv-sublist{list-style:none;margin:6px 0 2px;padding:0}
  #rv-short .rv-sublist>li{position:relative;padding-left:17px;margin-bottom:5px;font-size:14.2px;line-height:1.6;color:var(--ink-dim)}
  #rv-short .rv-sublist>li::before{content:"";position:absolute;left:1px;top:.62em;width:4px;height:4px;border-radius:50%;border:1px solid var(--ink-faint)}
  #rv-short li b,#rv-short .rv-line b{color:var(--ink);font-weight:500}
  #rv-short #s-profile .rv-list>li{font-family:var(--serif);font-size:clamp(18px,2.1vw,21px);line-height:1.45;color:var(--ink);margin-bottom:8px}
  #rv-short .rv-line{font-size:15px;color:var(--ink-dim);margin:0 0 8px;line-height:1.6;max-width:80ch}
  #rv-short .rv-sub-head{margin-top:52px}
  #rv-short a:not(.ev){color:var(--accent);border-bottom:1px solid rgba(185,207,128,.32);transition:border-color .2s}
  #rv-short a:not(.ev):hover{border-color:var(--accent)}

  /* evidence tags */
  .ev,.role li a.ev,.role h3 a.ev,.role .sub a.ev{display:inline;border-bottom:0!important;transition:filter .2s}
  .ev .ev-n{display:inline-flex;align-items:center;justify-content:center;min-width:17px;height:17px;padding:0 4px;
    margin-right:6px;border-radius:3px;font:600 10.5px/1 var(--sans);color:#fff;vertical-align:1px}
  .ev.ev-b .ev-l{font-weight:500}
  .ev:hover{filter:brightness(1.25)}
  .ev:hover .ev-l{text-decoration:underline;text-underline-offset:3px}
  .ev-tagonly{margin-right:2px}
  .ev-tagonly .ev-n{margin-right:4px}
  ${STD.map(s => `.ev-${s.n} .ev-n{background:${s.chip}} .ev-${s.n} .ev-l{color:${s.tint}}`).join('\n  ')}

  @media print{
    .rv-strip,.rv-toggle,.rv-dl,.rv-hero-bar{display:none!important}
    .ev .ev-n{color:#000;background:none!important;border:1px solid #999}
    .ev .ev-l{color:#111!important}
  }`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------------- helpers ---------------- */
  const h = (tag, attrs = {}, html = '') => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    if (html) el.innerHTML = html;
    return el;
  };
  const DL_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
  const dlButton = (href, label, small) => h('a', { class: 'btn' + (small ? ' btn-sm' : ''), href, download: '' }, DL_ICON + `<span class="dl-l">${label}</span>`);
  const evTag = (key) => {
    const e = EV[key];
    return h('a', { class: `ev ev-${e.n} ev-tagonly`, href: C.FILE + e.id + '/view', title: `Standard ${e.n} evidence: ${e.title} (opens in a new tab)`,
      'aria-label': `Standard ${e.n} evidence: ${e.title}` }, `<span class="ev-n" aria-hidden="true">${e.n}</span>`);
  };

  /* ---------------- view state ---------------- */
  let view = new URLSearchParams(location.search).get('view') === 'long' ? 'long' : 'short';
  const toggles = [];
  function setView(v, push) {
    view = v;
    document.body.classList.toggle('rv-short', v === 'short');
    document.body.classList.toggle('rv-long', v === 'long');
    toggles.forEach(t => t.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === v))));
    const barDl = document.querySelector('.rv-bar-dl');
    if (barDl) {
      barDl.href = v === 'short' ? C.SHORT_PDF : C.LONG_PDF;
      barDl.lastChild.textContent = v === 'short' ? 'Short PDF' : 'Long PDF';
      barDl.setAttribute('aria-label', v === 'short' ? 'Download short resume (PDF)' : 'Download long CV (PDF)');
      barDl.title = barDl.getAttribute('aria-label');
    }
    const tl = document.querySelector('.hero .tagline');
    if (tl) tl.textContent = TAGLINE;
    if (push) {
      const u = new URL(location.href);
      if (v === 'long') u.searchParams.set('view', 'long'); else u.searchParams.delete('view');
      history.replaceState(null, '', u);
    }
  }
  const makeToggle = (extraClass, compact) => {
    const t = h('div', { class: 'rv-toggle' + (extraClass ? ' ' + extraClass : ''), role: 'group', 'aria-label': 'Resume length' },
      compact ? '<button type="button" data-view="short">Short</button><button type="button" data-view="long">Long</button>'
              : '<button type="button" data-view="short">Short version</button><button type="button" data-view="long">Long version</button>');
    t.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      setView(b.dataset.view, true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    toggles.push(t);
    return t;
  };

  /* ---------------- page changes ---------------- */
  function setup(shortHtml) {
    const main = document.querySelector('main');
    const bar = document.querySelector('.bar');

    // mark the generated (long) content
    if (main) [...main.children].forEach(el => { if (!el.classList.contains('close')) el.classList.add('rv-long-part'); });

    // short view content
    if (main && shortHtml) {
      const holder = h('div', {}, shortHtml);
      const short = holder.querySelector('#rv-short');
      if (short) main.prepend(short);
    }
    const haveShort = !!document.getElementById('rv-short');
    if (!haveShort) view = 'long';

    // menu bar: nav per view, toggle, two downloads, standards strip
    if (bar) {
      const nav = bar.querySelector('nav');
      if (nav && haveShort) {
        nav.classList.add('rv-nav-long');
        const navShort = h('nav', { class: 'rv-nav-short' },
          '<a href="#s-profile">Profile</a><a href="#s-education">Education</a><a href="#s-experience">Experience</a><a href="#s-development">Development</a>');
        nav.after(navShort);
      }
      const oldBtn = bar.querySelector('.btn');
      const right = h('div', { class: 'rv-bar-right' });
      if (haveShort) right.append(makeToggle('', true));
      const barDl = dlButton(C.SHORT_PDF, 'Short PDF', true);
      barDl.classList.add('rv-bar-dl');
      right.append(barDl);
      if (oldBtn) oldBtn.replaceWith(right); else bar.querySelector('.bar-in')?.append(right);

      const strip = h('div', { class: 'rv-strip wrap', role: 'navigation', 'aria-label': 'Evidence portfolio by PTC standard' });
      STD.forEach(s => {
        const a = h('a', { href: C.FOLDER + s.folder, style: `background:${s.fill}`,
          title: `Standard ${s.n}: ${s.label} — evidence folder (opens in a new tab)`, 'aria-label': `Standard ${s.n}: ${s.label} evidence folder` },
          `<span class="n">${s.n}</span><span class="l">${s.label}</span><span class="s">${s.short}</span>`);
        strip.append(a);
      });
      bar.append(strip);
    }

    // hero: one bar under the contact lines (toggle, two downloads, colour key); closing: short and long PDFs
    document.querySelectorAll('.hero .btn').forEach(btn => btn.remove());
    const heroGrid = document.querySelector('.hero .hero-grid') || document.querySelector('.hero .wrap');
    if (heroGrid) {
      const heroBar = h('div', { class: 'rv-hero-bar wrap' });
      if (haveShort) heroBar.append(makeToggle('', false));
      heroBar.append(dlButton(C.SHORT_PDF, 'Short PDF', true), dlButton(C.LONG_PDF, 'Long PDF', true));
      const sw = STD.map(s => `<span class="sw" style="background:${s.tint}"></span>`).join('');
      heroBar.append(h('p', { class: 'rv-note' },
        `${sw}&ensp;The coloured strip opens my evidence by PTC standard; numbered tags open single pieces.`));
      heroGrid.after(heroBar);
    }
    document.querySelectorAll('.close .btn').forEach(btn => {
      const row = h('div', { class: 'rv-dl' });
      row.append(dlButton(C.SHORT_PDF, 'Download short (PDF)'), dlButton(C.LONG_PDF, 'Download long (PDF)'));
      btn.replaceWith(row);
    });

    // long view: same evidence tags and links as the short view
    LONG_TAGS.forEach(rule => {
      const el = [...document.querySelectorAll(rule.sel)].find(x => x.closest('.rv-long-part') && x.textContent.includes(rule.text));
      if (!el || el.querySelector('.ev')) return;
      const frag = document.createDocumentFragment();
      rule.ev.forEach(k => frag.append(evTag(k)));
      el.prepend(frag);
    });
    const prog = [...document.querySelectorAll('.rv-long-part .prose p')].find(p => /^\s*In progress/.test(p.textContent));
    if (prog) prog.innerHTML = IN_PROGRESS_HTML;
    const jip = [...document.querySelectorAll('.rv-long-part .role .org')].find(p => p.textContent.startsWith('Journeys in Podcasting') && !p.querySelector('a'));
    if (jip) jip.innerHTML = jip.innerHTML.replace('Journeys in Podcasting', `<a href="${SPOTIFY}">Journeys in Podcasting</a>`);

    // every web link and PDF opens in a new tab
    document.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      a.target = '_blank';
      a.rel = 'noopener';
    });

    // in-page links switch view when they point into the other one
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      if (view === 'short' && target.closest('.rv-long-part')) setView('long', true);
      if (view === 'long' && target.closest('#rv-short')) setView('short', true);
    });

    setView(view, false);
    document.body.classList.remove('rv-loading');
  }

  function start() {
    document.body.classList.add('rv-loading');
    const fallback = setTimeout(() => document.body.classList.remove('rv-loading'), 2500);
    fetch(C.SHORT_HTML, { cache: 'no-cache' })
      .then(r => (r.ok ? r.text() : ''))
      .catch(() => '')
      .then(html => { clearTimeout(fallback); setup(html); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
