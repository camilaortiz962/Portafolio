// ============================================================
// LOADER + TRANSICIONES ENTRE PÁGINAS
// ============================================================
// #loader está en el HTML de todas las páginas y un script en <head>
// pone html.is-loading antes del primer pintado, así que la cortina ya
// está cerrada cuando esto corre.
//  · Carga normal: MACA + contador 000→100 real (fuentes, DOM, primer
//    fotograma del personaje y load, con tope de tiempo) y la cortina sube.
//  · Clic en un enlace a otra página del sitio: la cortina baja desde
//    abajo con el nombre del destino y recién entonces se navega.
//  · Al llegar por esa cortina (html.is-arriving): arranca cerrada con
//    ese nombre y sube en cuanto la página está lista.
// pageRevealed se resuelve cuando la cortina se levanta: la entrada del
// hero y el personaje esperan a eso para no animarse escondidos.
let resolveRevealed;
const pageRevealed = new Promise((r) => { resolveRevealed = r; });

(function initLoader() {
  const html = document.documentElement;
  const loader = document.getElementById('loader');
  if (!loader) { html.classList.remove('is-loading', 'is-arriving'); resolveRevealed(); return; }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pctEl = loader.querySelector('[data-loader-pct]');
  const barEl = loader.querySelector('[data-loader-bar]');
  const labelEl = loader.querySelector('[data-loader-label]');
  const destEl = loader.querySelector('[data-loader-dest]');
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
    del(k) { try { sessionStorage.removeItem(k); } catch (e) {} },
  };

  const NAMES = {
    'index.html': 'Inicio',
    '3d.html': '3D',
    'desarrollo-web.html': 'Desarrollo web',
    'editorial.html': 'Editorial',
    'ilustracion.html': 'Ilustración',
    'inteligencia-artificial.html': 'Inteligencia artificial',
  };
  const fileOf = (url) => (url.pathname.split('/').pop() || 'index.html');

  let lifted = false;
  function lift() {
    if (lifted) return;
    lifted = true;
    html.classList.remove('is-loading', 'is-arriving');
    resolveRevealed();
    // back to the counter look once it's off screen
    setTimeout(() => loader.classList.remove('is-transition'), 1000);
  }
  setTimeout(lift, 7000);                    // failsafe: never trap the page

  const arriving = html.classList.contains('is-arriving');
  const dest = store.get('maca:arrive');
  store.del('maca:arrive');

  if (arriving) {
    // ---- arrived through the curtain: show where we are, then open
    loader.classList.add('is-transition');
    destEl.textContent = dest || NAMES[fileOf(location)] || 'MACA';
    labelEl.textContent = 'MACA.OS — ABRIENDO';
    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    Promise.race([fonts, new Promise((r) => setTimeout(r, 600))])
      .then(() => setTimeout(lift, reduce ? 0 : 280));
  } else {
    // ---- full load: real progress counter
    const seen = !!store.get('maca:seen');
    store.set('maca:seen', '1');
    const MIN = reduce ? 300 : (seen ? 700 : 1300);
    const start = performance.now();
    const parts = { dom: 0, fonts: 0, frame: 0, load: 0 };
    const W = { dom: 20, fonts: 30, frame: 30, load: 20 };
    const done = (k) => { parts[k] = 1; };
    done('dom');                               // this script runs at the end of <body>
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => done('fonts'));
    if (document.querySelector('.hero__canvas')) {
      window.addEventListener('maca:firstframe', () => done('frame'), { once: true });
    } else done('frame');
    if (document.readyState === 'complete') done('load');
    else window.addEventListener('load', () => done('load'), { once: true });
    // the animation frames load in the background: don't wait forever on "load"
    setTimeout(() => done('load'), 2500);

    let shown = 0;
    (function tick(t) {
      if (lifted) return;
      const target = Object.keys(W).reduce((s, k) => s + W[k] * parts[k], 0);
      // time-based ceiling so the counter climbs smoothly instead of jumping
      const cap = Math.min(100, ((t - start) / MIN) * 100);
      shown += (Math.min(target, cap) - shown) * 0.12;
      if (target >= 100 && cap >= 100 && shown > 99.4) shown = 100;
      pctEl.textContent = String(Math.floor(shown)).padStart(3, '0');
      barEl.style.transform = `scaleX(${(shown / 100).toFixed(4)})`;
      if (shown >= 100) { setTimeout(lift, reduce ? 0 : 220); return; }
      requestAnimationFrame(tick);
    })(start);
  }

  // ---- leaving: cover the page, then navigate
  let leaving = false;
  document.addEventListener('click', (e) => {
    if (leaving || e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    let url;
    try { url = new URL(a.getAttribute('href'), location.href); } catch (err) { return; }
    if (url.origin !== location.origin) return;
    if (!/\.html$|\/$/.test(url.pathname)) return;           // pages only, not PDFs
    if (fileOf(url) === fileOf(location)) return;            // same page: plain anchor scroll
    e.preventDefault();
    leaving = true;
    const name = NAMES[fileOf(url)] || 'MACA';
    store.set('maca:arrive', name);
    loader.classList.add('is-transition');
    destEl.textContent = name;
    labelEl.textContent = 'MACA.OS — CARGANDO';
    loader.classList.add('is-from-below');
    void loader.offsetWidth;                                 // commit the start position
    loader.classList.remove('is-from-below');
    loader.classList.add('is-covering');
    setTimeout(() => { location.href = url.href; }, reduce ? 300 : 820);
  });

  // back/forward cache: the page comes back with the curtain still down
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    leaving = false;
    store.del('maca:arrive');
    loader.classList.remove('is-covering', 'is-transition');
    html.classList.remove('is-loading', 'is-arriving');
  });
})();

// ============================================================
// NAV — scroll state + mobile toggle
// ============================================================
const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

const onNavScroll = () => {
  nav.classList.toggle('is-scrolled', window.scrollY > 40);
};
onNavScroll();
window.addEventListener('scroll', onNavScroll, { passive: true });

navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('is-open');
  navToggle.classList.toggle('is-open', open);
  navToggle.setAttribute('aria-expanded', String(open));
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('is-open');
    navToggle.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// ============================================================
// REVEAL ON SCROLL (fade/slide entrances, one-time per element)
// ============================================================
// .categorias is deliberately excluded here: at 500vh tall, a 0.15 ratio
// threshold needs ~675px of it inside the viewport before firing, which
// only happens once its top edge is already within ~150-300px of the
// viewport top — so for most of the scroll distance leading up to it,
// it sat at opacity:0 (rendering as a long stretch of plain black
// background) before ever crossing that threshold. It doesn't need this
// generic fade-in anyway: its own .categoria/.categoria.is-active
// dimming already provides the entrance polish once it's in view.
const revealTargets = document.querySelectorAll(
  '.manifiesto, .proceso, .sobre-mi, .contacto__content, ' +
  '.spark, .obsesiones, .personalidades, .experiment-lab'
);
revealTargets.forEach(el => el.classList.add('reveal'));

const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

revealTargets.forEach(el => io.observe(el));

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ============================================================
// HERO → MANIFIESTO — una sola imagen, un solo scroll continuo
// ============================================================
// Debajo de 1101px el Manifiesto vive donde siempre (sección estática
// después del hero, con su propia foto e IntersectionObserver) — nada
// de esto se activa ahí. En desktop, en cambio, JS mueve físicamente
// el <section class="manifiesto"> DENTRO de .hero-pin, apilado sobre
// el hero (position:absolute;inset:0 vía CSS ".hero-pin .manifiesto"),
// para que sus textos puedan aparecer mientras la MISMA imagen
// (.hero__figure) sigue compartiendo esa pantalla fija — no hay una
// segunda copia visible: la foto propia del Manifiesto se oculta
// (".hero-pin .manifiesto__figure{display:none}") porque .hero__figure
// hace ese papel todo el tiempo. Esto reemplaza un primer intento en el
// que el Manifiesto se quedaba en flujo normal debajo del hero: como
// position:sticky no deja ver nada de lo que sigue mientras está fijo,
// el aviso de texto solo podía empezar cuando el pin ya soltaba — y en
// ese instante de traspaso se veían las DOS fotos a la vez (la del hero
// saliendo por arriba, la del manifiesto entrando por abajo), exactamente
// la sensación de "imágenes diferentes" que se quería evitar.
// .hero-scroll da 160vh de scroll fijo (dentro de sus 260vh totales,
// menos el 100vh que ocupa la vista inicial): la primera mitad encoge
// avatar + wordmark, la segunda revela los textos del manifiesto.
(function initHeroManifiesto() {
  const wrap = document.querySelector('.hero-scroll');
  const pin = document.querySelector('.hero-pin');
  const wordmark = document.querySelector('.hero__wordmark');
  const figure = document.querySelector('.hero__figure');
  const scrollHint = document.querySelector('.hero__scroll');
  // hero's own resting-state copy (system tag, headline/tagline/identity,
  // scroll hint) — all fade out together, fast, right as scrolling starts,
  // so none of it lingers into the wordmark-shrink/manifiesto-reveal frame
  const heroFadeEls = document.querySelectorAll('.hero__fade');
  const manifiesto = document.querySelector('.manifiesto');
  if (!wrap || !pin || !wordmark || !figure || !manifiesto) return;

  const originalParent = manifiesto.parentNode;
  const originalNext = manifiesto.nextSibling;
  let merged = false;

  function isDesktop() {
    return window.innerWidth > 1100;
  }

  // Only meant to hand off from the CSS entrance keyframes to the JS-driven
  // scroll styles below — both of which are desktop-only. On tablet/mobile
  // (or reduced-motion) nothing ever sets figure/wordmark inline styles, so
  // clearing "animation" there would strand them at the keyframes' 0%
  // opacity:0 with nothing left to hold opacity:1.
  let entranceCleared = false;
  function clearEntranceAnimations() {
    if (entranceCleared || !isDesktop() || prefersReducedMotion) return;
    entranceCleared = true;
    wordmark.style.animation = 'none';
    figure.style.animation = 'none';
    if (scrollHint) scrollHint.style.animation = 'none';
    // each has its own entrance keyframe with fill-mode:both — left running,
    // its "to" state (opacity:1) would keep overriding the inline opacity
    // the scroll-driven fade below tries to set, exactly like wordmark/figure
    heroFadeEls.forEach((el) => { el.style.animation = 'none'; });
  }
  // entrance keyframes only start once the loader curtain has lifted
  pageRevealed.then(() => setTimeout(clearEntranceAnimations, 1700));

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp01(v) { return Math.max(0, Math.min(1, v)); }

  // hero rest geometry → the Manifiesto avatar's own rest geometry,
  // both expressed in vh against the same 100vh pinned viewport
  // (the figure is now the 4:3 animated canvas — see initPersonaje — so
  // these match the desktop .hero__figure top:14% / height:100% in the CSS)
  const HERO_TOP = 14, HERO_HEIGHT = 100;
  // top:11vh (not 4) so the avatar's top edge clears the fixed nav, which
  // has an opaque background by the time this section is ever visible —
  // matches the manifiesto padding-top bump below for the same reason
  const TARGET_TOP = 11, TARGET_HEIGHT = 89;

  const eyebrow = manifiesto.querySelector(':scope > .eyebrow--line');
  // its "02 / 09" system tag used to sit visible over the hero from the
  // start (nothing faded it in) — it now arrives together with the eyebrow
  const sectionTag = manifiesto.querySelector(':scope > .section-tag');
  const intro = manifiesto.querySelector('.manifiesto__intro');
  const masks = [
    manifiesto.querySelector('.manifiesto__pre .mask__inner'),
    manifiesto.querySelector('.manifiesto__crear > h1 .mask__inner'),
    manifiesto.querySelector('.manifiesto__caps .mask:nth-of-type(1) .mask__inner'),
    manifiesto.querySelector('.manifiesto__caps .mask:nth-of-type(2) .mask__inner'),
    manifiesto.querySelector('.manifiesto__ver .mask__inner'),
  ];
  const points = [
    manifiesto.querySelector('.point--01'),
    manifiesto.querySelector('.point--02'),
    manifiesto.querySelector('.point--03'),
    manifiesto.querySelector('.point--04'),
    manifiesto.querySelector('.point--05'),
  ];

  // [inicio, fin] de cada elemento dentro del progreso de revelado (0→1),
  // escalonados como en el sistema original (columnas izq/der en paralelo)
  const windows = [
    [sectionTag, 0.00, 0.22],
    [eyebrow, 0.00, 0.22],
    [masks[0], 0.04, 0.26],
    [masks[1], 0.08, 0.30],
    [masks[2], 0.12, 0.34],
    [masks[3], 0.16, 0.38],
    [masks[4], 0.14, 0.36],
    [intro, 0.22, 0.44],
    [points[0], 0.30, 0.55],
    [points[1], 0.38, 0.62],
    [points[2], 0.30, 0.55],
    [points[3], 0.38, 0.62],
    [points[4], 0.46, 0.70],
  ].filter(([el]) => !!el);

  function applyLocal(el, localP) {
    if (masks.includes(el)) {
      el.style.transition = 'none';
      el.style.transform = `translateY(${lerp(112, 0, localP).toFixed(2)}%)`;
    } else if (points.includes(el)) {
      el.style.transition = 'none';
      el.style.opacity = localP.toFixed(3);
      el.style.transform = `translateY(${lerp(18, 0, localP).toFixed(2)}px)`;
    } else {
      // eyebrow / intro
      el.style.transition = 'none';
      el.style.opacity = localP.toFixed(3);
      el.style.transform = `translateY(${lerp(14, 0, localP).toFixed(2)}px)`;
    }
  }

  function renderShrink(p) {
    const wordmarkScale = lerp(1, 0.22, p);
    // --wm-x: centred (-50%) by default, 0 on the desktop two-column hero
    wordmark.style.transform = `translateX(var(--wm-x, -50%)) scale(${wordmarkScale.toFixed(4)})`;
    wordmark.style.opacity = (1 - p).toFixed(3);

    figure.style.top = lerp(HERO_TOP, TARGET_TOP, p).toFixed(3) + 'vh';
    figure.style.height = lerp(HERO_HEIGHT, TARGET_HEIGHT, p).toFixed(3) + 'vh';
    // opacity (and transform) are owned by initPersonaje from here on —
    // it keeps her visible after the pin releases and fades her out later

    const fadeOpacity = Math.max(0, 1 - p * 4).toFixed(3);
    heroFadeEls.forEach((el) => { el.style.opacity = fadeOpacity; });
  }

  function renderReveal(p) {
    windows.forEach(([el, start, end]) => {
      const localP = clamp01((p - start) / (end - start));
      applyLocal(el, localP);
    });
  }

  function resetHero() {
    wordmark.style.transform = '';
    wordmark.style.opacity = '';
    wordmark.style.animation = '';
    figure.style.top = '';
    figure.style.height = '';
    figure.style.opacity = '';
    figure.style.animation = '';
    figure.style.transform = '';
    if (scrollHint) scrollHint.style.animation = '';
    heroFadeEls.forEach((el) => { el.style.opacity = ''; el.style.animation = ''; });
    // let clearEntranceAnimations() run again if resized back to desktop
    entranceCleared = false;
  }

  function resetReveal() {
    windows.forEach(([el]) => {
      el.style.transition = '';
      el.style.transform = '';
      el.style.opacity = '';
    });
  }

  function mergeManifiesto() {
    if (merged) return;
    merged = true;
    pin.appendChild(manifiesto);
  }

  function unmergeManifiesto() {
    if (!merged) return;
    merged = false;
    originalParent.insertBefore(manifiesto, originalNext);
  }

  let enabled = false;

  function update() {
    if (!enabled) return;
    const rect = wrap.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    let p = total > 0 ? -rect.top / total : 0;
    p = clamp01(p);
    renderShrink(clamp01(p / 0.5));
    renderReveal(clamp01((p - 0.5) / 0.5));
  }

  function onScroll() {
    clearEntranceAnimations();
    requestAnimationFrame(update);
  }

  function sync() {
    const active = isDesktop() && !prefersReducedMotion;
    if (active && !enabled) {
      enabled = true;
      mergeManifiesto();
      window.addEventListener('scroll', onScroll, { passive: true });
      update();
    } else if (!active && enabled) {
      enabled = false;
      window.removeEventListener('scroll', onScroll);
      resetHero();
      resetReveal();
      unmergeManifiesto();
    }
  }

  sync();
  window.addEventListener('resize', sync);
})();

// ============================================================
// CATEGORÍAS — ROTONDA 3D (inspirada en lucas-aufrere.com/projets)
// ============================================================
// Desktop (≥901px, sin reduced-motion): las 5 categorías cuelgan de la
// pared interior de una rotonda 3D (CSS 3D, sin librerías). Hay 10
// paneles (cada categoría dos veces, para que el anillo se vea lleno).
// Una sola fuente de verdad: el scroll de la página. La sección mide
// 450vh y .rotonde queda fija (sticky); el progreso del scroll decide el
// ángulo. Arrastrar o usar ← → no gira el anillo directamente: mueve el
// scroll la distancia equivalente, así nunca se desincronizan. Al soltar
// el arrastre encaja en la categoría más cercana. Clic (o Enter) en el
// panel del frente abre la vista detallada; en otro panel, gira hasta él.
// Debajo de 901px los <article> conservan su layout apilado de siempre.
(function initCategoriasRotonde() {
  const section = document.querySelector('.categorias');
  if (!section) return;
  const articles = Array.from(section.querySelectorAll('.categoria[data-panel]'));
  const n = articles.length;
  if (!n) return;

  const text = (el, sel) => {
    const t = el.querySelector(sel);
    return t ? t.innerText.replace(/\s+/g, ' ').trim() : '';
  };
  const cats = articles.map((a, i) => ({
    num: String(i + 1).padStart(2, '0'),
    name: text(a, 'h2'),
    subtitle: text(a, '.categoria__subtitle'),
    body: text(a, '.categoria__text'),
    tags: text(a, '.categoria__tags').split('|').map(s => s.trim()).filter(Boolean).join(' · '),
    words: Array.from(a.querySelectorAll('.categoria__list span')).map(s => s.textContent.trim()).join(' · '),
    href: a.querySelector('.categoria__cta')?.getAttribute('href') || '#',
    img: a.dataset.panel,
    pos: a.dataset.panelPos || '50% 50%',
    alt: (a.querySelector('img') || {}).alt || '',
  }));

  const SLOTS = n * 2;
  const STEP = 360 / SLOTS;              // degrees between neighbouring panels
  const pad = (k) => String(k).padStart(2, '0');

  // ---------- build the DOM
  const rot = document.createElement('div');
  rot.className = 'rotonde';
  rot.innerHTML = `
    <div class="rotonde__stage"><div class="rotonde__ring"></div></div>
    <div class="rotonde__ui">
      <p class="rotonde__mono rotonde__index"><span data-cur>01</span> / ${pad(n)}</p>
      <p class="rotonde__mono rotonde__title">Proyectos seleccionados</p>
      <p class="rotonde__mono rotonde__tag">MACA.OS — Proyectos</p>
      <div class="rotonde__caption">
        <p class="rotonde__mono rotonde__caption-meta"></p>
        <p class="rotonde__caption-name"></p>
      </div>
      <div class="rotonde__hint"><span class="rotonde__hint-dot"></span><span class="rotonde__mono rotonde__hint-text">Arrastra · Rueda · Flechas ← →</span></div>
      <ol class="rotonde__progress" aria-hidden="true">${cats.map(() => '<li class="rotonde__segment"></li>').join('')}</ol>
    </div>`;
  const ring = rot.querySelector('.rotonde__ring');
  const curEl = rot.querySelector('[data-cur]');
  const caption = rot.querySelector('.rotonde__caption');
  const capMeta = rot.querySelector('.rotonde__caption-meta');
  const capName = rot.querySelector('.rotonde__caption-name');
  const hint = rot.querySelector('.rotonde__hint');
  const segs = Array.from(rot.querySelectorAll('.rotonde__segment'));

  const panels = [];
  for (let s = 0; s < SLOTS; s++) {
    const c = cats[s % n];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'rotonde__panel';
    b.setAttribute('aria-label', `${c.name} — ver detalle`);
    b.innerHTML = `<img src="${c.img}" alt="" loading="lazy" decoding="async" style="object-position:${c.pos}"><span class="rotonde__shade"></span>`;
    ring.appendChild(b);
    panels.push({ el: b, shade: b.lastElementChild, slot: s, cat: s % n, front: null, hidden: null });
  }

  // ---------- detail view
  const detail = document.createElement('div');
  detail.className = 'rotonde-detail';
  detail.setAttribute('role', 'dialog');
  detail.setAttribute('aria-modal', 'true');
  detail.setAttribute('aria-hidden', 'true');
  detail.innerHTML = `
    <div class="rotonde-detail__content">
      <p class="rotonde__mono rotonde-detail__meta"><span data-d="num"></span><span data-d="sub"></span></p>
      <h3 class="rotonde-detail__title" data-d="name"></h3>
      <p class="rotonde-detail__role" data-d="role"></p>
      <p class="rotonde-detail__text" data-d="body"></p>
      <dl class="rotonde-detail__specs">
        <div class="rotonde-detail__row"><dt class="rotonde__mono">Técnicas</dt><dd data-d="tags"></dd></div>
        <div class="rotonde-detail__row"><dt class="rotonde__mono">Palabras</dt><dd data-d="words"></dd></div>
      </dl>
      <a class="categoria__cta" data-d="cta"><span class="circle-arrow">→</span> VER PROYECTOS</a>
    </div>
    <div class="rotonde-detail__media"><img alt="" data-d="img"></div>
    <button type="button" class="rotonde-detail__close" aria-label="Cerrar">✕</button>`;
  const d = (k) => detail.querySelector(`[data-d="${k}"]`);
  const closeBtn = detail.querySelector('.rotonde-detail__close');
  let lastFocus = null;

  function openDetail(ci) {
    const c = cats[ci];
    d('num').textContent = `${c.num} / ${pad(n)}`;
    d('sub').textContent = c.name;
    d('name').textContent = c.name;
    d('role').textContent = c.subtitle.charAt(0) + c.subtitle.slice(1).toLowerCase();
    d('body').textContent = c.body;
    d('tags').textContent = c.tags;
    d('words').textContent = c.words;
    d('cta').setAttribute('href', c.href);
    d('img').src = c.img;
    d('img').alt = c.alt;
    d('img').style.objectPosition = c.pos;
    lastFocus = document.activeElement;
    detail.classList.add('is-open');
    detail.setAttribute('aria-hidden', 'false');
    document.body.classList.add('rotonde-detail-open');
    closeBtn.focus({ preventScroll: true });
  }
  function closeDetail() {
    if (!detail.classList.contains('is-open')) return;
    detail.classList.remove('is-open');
    detail.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('rotonde-detail-open');
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }
  closeBtn.addEventListener('click', closeDetail);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDetail(); });

  // ---------- geometry + scroll mapping
  let enabled = false;
  let R = 600, PW = 340, ZC = 360;
  let target = 0, shown = 0;            // ring angle in degrees
  let active = -1, interacted = false;
  const MAX = (n - 1) * STEP;

  function sizes() {
    PW = Math.max(240, Math.min(440, window.innerWidth * 0.22, window.innerHeight * 0.42));
    // radius 2.2× the panel width: each slot's chord (2R·sin18°) is ~1.36×
    // the panel, i.e. about a third of a panel of black between photos
    R = PW * 2.2;
    ZC = R * 0.66;
    measureRange();
    rot.style.setProperty('--pw', PW + 'px');
    ring.style.transform = `translateZ(${ZC}px)`;
  }

  // cached: reading layout every animation frame forces style recalcs
  let rangeCache = { top: 0, len: 1 };
  function measureRange() {
    rangeCache = {
      top: section.getBoundingClientRect().top + window.scrollY,
      len: section.offsetHeight - window.innerHeight,
    };
  }
  function range() { return rangeCache; }
  function angleFromScroll() {
    const { top, len } = range();
    const p = len > 0 ? (window.scrollY - top) / len : 0;
    return Math.max(0, Math.min(1, p)) * MAX;
  }
  function scrollForAngle(a) {
    const { top, len } = range();
    return top + (Math.max(0, Math.min(MAX, a)) / MAX) * len;
  }
  function goTo(ci, smooth = true) {
    window.scrollTo({ top: scrollForAngle(ci * STEP), behavior: smooth ? 'smooth' : 'instant' });
  }

  function markInteracted() {
    if (interacted) return;
    interacted = true;
    hint.classList.add('is-hidden');
  }

  function setActive(ci) {
    if (ci === active) return;
    active = ci;
    curEl.textContent = cats[ci].num;
    segs.forEach((s, i) => s.classList.toggle('is-active', i === ci));
    caption.classList.add('is-swapping');
    setTimeout(() => {
      capMeta.textContent = `${cats[ci].num} — ${cats[ci].subtitle}`;
      capName.textContent = cats[ci].name;
      caption.classList.remove('is-swapping');
    }, 180);
  }

  // per frame only transform + opacity are written (both compositor-only,
  // no repaint); the side panels are darkened by their own shade layer's
  // opacity instead of a CSS filter, which forced a full repaint of every
  // image each frame. Visibility / tabindex are touched only on change.
  function render() {
    for (const p of panels) {
      let ang = p.slot * STEP - shown;
      ang = ((ang + 540) % 360) - 180;          // wrap to [-180, 180)
      const abs = Math.abs(ang);
      const op = abs < 62 ? 1 : Math.max(0, 1 - (abs - 62) / 38);
      const dim = Math.min(1, abs / STEP);      // 0 at the front, 1 a slot away
      p.el.style.transform = `rotateY(${(-ang).toFixed(3)}deg) translateZ(${-R}px)`;
      p.el.style.opacity = op.toFixed(3);
      p.shade.style.opacity = (dim * 0.6).toFixed(3);
      const hidden = op < 0.01;
      if (hidden !== p.hidden) { p.hidden = hidden; p.el.style.visibility = hidden ? 'hidden' : ''; }
      const front = abs < STEP / 2;
      if (front !== p.front) { p.front = front; p.el.tabIndex = front ? 0 : -1; }
    }
  }

  // frame-rate independent critically-damped follow: the ring glides to
  // the scroll position with inertia instead of jumping wheel-step by
  // wheel-step, and behaves the same on 60 Hz and 144 Hz screens
  let raf = null, lastT = 0, vel = 0;
  function loop(t) {
    raf = null;
    if (!enabled) return;
    const dt = Math.min(0.05, lastT ? (t - lastT) / 1000 : 1 / 60);
    lastT = t;
    target = angleFromScroll();
    const k = 70, c = 2 * Math.sqrt(k);         // stiffness / critical damping
    vel += (k * (target - shown) - c * vel) * dt;
    shown += vel * dt;
    if (Math.abs(target - shown) < 0.005 && Math.abs(vel) < 0.01) { shown = target; vel = 0; }
    render();
    setActive(((Math.round(shown / STEP) % n) + n) % n);
    if (shown !== target || vel !== 0) raf = requestAnimationFrame(loop);
    else lastT = 0;
  }
  function kick() { if (!raf) raf = requestAnimationFrame(loop); }

  // ---------- drag → scroll
  let drag = null;
  let justDragged = false;
  rot.addEventListener('pointerdown', (e) => {
    if (!enabled || e.button !== 0) return;
    drag = { x: e.clientX, y: window.scrollY, moved: 0, id: e.pointerId };
  });
  window.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    drag.moved = Math.max(drag.moved, Math.abs(dx));
    if (drag.moved > 4) {
      rot.classList.add('is-dragging');
      markInteracted();
      const { len } = range();
      // one panel width of drag ≈ one category
      const dAng = (-dx / PW) * STEP;
      window.scrollTo({ top: drag.y + (dAng / MAX) * len, behavior: 'instant' });
    }
  });
  window.addEventListener('pointerup', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const wasDrag = drag.moved > 4;
    drag = null;
    rot.classList.remove('is-dragging');
    if (wasDrag) {
      justDragged = true;               // swallow the click that follows
      setTimeout(() => { justDragged = false; }, 0);
      goTo(Math.round(angleFromScroll() / STEP));
    }
  });
  // a real drag must not also count as a click on the panel underneath
  rot.addEventListener('click', (e) => {
    const btn = e.target.closest('.rotonde__panel');
    if (!btn || justDragged) return;
    const p = panels.find(q => q.el === btn);
    if (!p) return;
    markInteracted();
    if (p.front) openDetail(p.cat);
    else {
      // turn the short way round to that panel
      let ang = p.slot * STEP - shown;
      ang = ((ang + 540) % 360) - 180;
      goTo(Math.round((shown + ang) / STEP));
    }
  }, true);

  // ---------- keyboard: arrows while the rotunda fills the screen
  window.addEventListener('keydown', (e) => {
    if (!enabled || detail.classList.contains('is-open')) return;
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const r = rot.getBoundingClientRect();
    if (r.top > 2 || r.bottom < window.innerHeight - 2) return;
    e.preventDefault();
    markInteracted();
    const cur = Math.round(angleFromScroll() / STEP);
    goTo(Math.max(0, Math.min(n - 1, cur + (e.key === 'ArrowRight' ? 1 : -1))));
  });

  // when the wheel/trackpad stops halfway between two categories, glide
  // to the nearest one (like a snap) — only while the rotunda is pinned,
  // so it never pulls the page when entering or leaving the section
  let snapTimer = null, snapping = false;
  function snapSoon() {
    clearTimeout(snapTimer);
    snapTimer = setTimeout(() => {
      if (!enabled || drag || detail.classList.contains('is-open')) return;
      const { top, len } = range();
      const y = window.scrollY;
      if (y <= top + 2 || y >= top + len - 2) return;
      const a = angleFromScroll();
      const near = Math.round(a / STEP);
      if (Math.abs(a - near * STEP) < 0.5) return;
      snapping = true;
      goTo(near);
      setTimeout(() => { snapping = false; }, 700);
    }, 160);
  }

  function onScroll() {
    if (!enabled) return;
    if (!interacted && window.scrollY - range().top > 40 && window.scrollY < range().top + range().len) markInteracted();
    if (!snapping && !drag) snapSoon();
    kick();
  }

  function isDesktop() {
    return window.innerWidth >= 901 && !prefersReducedMotion;
  }

  function sync() {
    const want = isDesktop();
    if (want && !enabled) {
      enabled = true;
      section.classList.add('is-rotonde');
      section.prepend(rot);
      if (!detail.isConnected) document.body.appendChild(detail);
      sizes();
      shown = target = angleFromScroll();
      render();
      setActive(Math.round(shown / STEP) % n);
      window.addEventListener('scroll', onScroll, { passive: true });
    } else if (!want && enabled) {
      enabled = false;
      closeDetail();
      section.classList.remove('is-rotonde');
      rot.remove();
      window.removeEventListener('scroll', onScroll);
    } else if (enabled) {
      sizes();
      kick();
    }
  }

  sync();
  window.addEventListener('resize', sync);
  // images / fonts above shift where the section starts after load
  window.addEventListener('load', () => { if (enabled) { measureRange(); kick(); } });
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => { if (enabled) { measureRange(); kick(); } }).observe(document.body);
  }
})();

// ============================================================
// PROCESO — narrativa vinculada al scroll
// ============================================================
// PRIORIDAD 5. The left text and the figure are pinned with CSS
// (position:sticky); this just tracks which .step is crossing a thin
// band at the vertical centre of the screen and marks it as the
// protagonist. The very first entrance stagger delay is applied inline
// and cleared right after, so later spotlight toggles stay snappy.
(function initProcesoSteps() {
  const steps = document.querySelectorAll('.proceso .step');
  if (!steps.length) return;

  steps.forEach((step, i) => {
    step.style.transitionDelay = `${0.05 + i * 0.11}s`;
  });
  setTimeout(() => {
    steps.forEach(step => { step.style.transitionDelay = ''; });
  }, 900);

  if (prefersReducedMotion) {
    steps.forEach(step => step.classList.add('is-centered'));
    return;
  }

  const centerIo = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      entry.target.classList.toggle('is-centered', entry.isIntersecting);
    });
  }, { threshold: 0, rootMargin: '-42% 0px -42% 0px' });

  steps.forEach(step => centerIo.observe(step));
})();

// ============================================================
// CONTACT FORM — floating labels handled in CSS; here: validation +
// a success transition instead of a browser alert()
// ============================================================
const form = document.getElementById('contactForm');
const status = document.getElementById('formStatus');
const formWrap = document.getElementById('formWrap');

if (form) {
  const submitBtn = form.querySelector('.contacto__submit');
  // native "Please fill out this field" bubbles are plain browser chrome
  // that clashes with the site's look (the form has novalidate) — this
  // marks the offending .field wrapper instead, using the same red the
  // status text already uses, so the whole thing reads as one system
  const requiredFields = Array.from(form.querySelectorAll('[required]'));

  function setFieldInvalid(field, invalid) {
    const wrap = field.closest('.field');
    if (wrap) wrap.classList.toggle('field--invalid', invalid);
  }

  requiredFields.forEach((field) => {
    field.addEventListener('input', () => setFieldInvalid(field, false));
    field.addEventListener('change', () => setFieldInvalid(field, false));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    let firstInvalid = null;
    requiredFields.forEach((field) => {
      const invalid = !field.value.trim();
      setFieldInvalid(field, invalid);
      if (invalid && !firstInvalid) firstInvalid = field;
    });

    if (firstInvalid) {
      status.textContent = 'Por favor completa los campos marcados.';
      firstInvalid.focus();
      return;
    }

    status.textContent = 'Enviando…';
    if (submitBtn) submitBtn.disabled = true;

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        status.textContent = '';
        formWrap.classList.add('is-success');
        form.reset();
      } else {
        const data = await response.json().catch(() => null);
        status.textContent =
          data && Array.isArray(data.errors) && data.errors.length
            ? data.errors.map((err) => err.message).join(', ')
            : 'No se pudo enviar el mensaje. Intenta de nuevo o escríbeme directo a mariacamilaortizherrera@gmail.com.';
      }
    } catch (err) {
      status.textContent =
        'No se pudo enviar el mensaje. Revisa tu conexión e intenta de nuevo, o escríbeme directo a mariacamilaortizherrera@gmail.com.';
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

// ============================================================
// CARRUSELES — páginas de proyecto (catálogos vistos uno a uno)
// ============================================================
// Generic: any ".carrusel[data-carrusel]" gets prev/next buttons, a
// counter, keyboard arrows (while focused) and touch swipe. Only present
// on the project pages (editorial.html etc.) — a no-op everywhere else.
document.querySelectorAll('.carrusel[data-carrusel]').forEach((carrusel) => {
  const track = carrusel.querySelector('.carrusel__track');
  const slides = Array.from(carrusel.querySelectorAll('.carrusel__slide'));
  const prevBtn = carrusel.querySelector('.carrusel__btn--prev');
  const nextBtn = carrusel.querySelector('.carrusel__btn--next');
  const currentEl = carrusel.querySelector('[data-current]');
  const totalEl = carrusel.querySelector('[data-total]');
  if (!track || !slides.length) return;

  let index = 0;
  if (totalEl) totalEl.textContent = String(slides.length);

  function render() {
    track.style.transform = `translate3d(-${index * 100}%,0,0)`;
    if (currentEl) currentEl.textContent = String(index + 1);
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === slides.length - 1;
  }

  function go(delta) {
    index = Math.max(0, Math.min(slides.length - 1, index + delta));
    render();
  }

  if (prevBtn) prevBtn.addEventListener('click', () => go(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => go(1));

  carrusel.setAttribute('tabindex', '0');
  carrusel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  });

  let touchStartX = null;
  track.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  track.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchStartX = null;
  }, { passive: true });

  render();
});

// ============================================================
// PERSONAJE — el avatar es una secuencia de 145 fotogramas (video sobre fondo negro, con el
// fondo recortado, assets/personaje/{hd,sd}/f000-f144.webp) dibujada en un canvas.
// El scroll decide qué fotograma se ve y, en desktop, dónde está ella:
//
//   Hero ............ derecha, brazos cruzados (MACA a la izquierda) (f 0)
//   Manifiesto ...... centro, baja los brazos y mira      (f 22)
//   ¿Y si...? ....... izquierda, se gira hacia las preguntas, mueve el pelo (f 42)
//   Obsesiones ...... derecha, primer plano: cierra los ojos y guiña (f 68)
//                     … y sonríe                          (f 84)
//   Personalidades .. se aleja y desaparece               (f 104)
//
// Las secciones "¿Y si...?" y Obsesiones se reacomodan (CSS,
// .personaje-travel) para dejarle libre el lado por el que pasa.
// initHeroManifiesto sigue controlando top/height durante el pin; esto
// controla fotograma, transform y opacidad. Debajo de 1101px no hay
// recorrido: se queda en el hero y solo avanza la animación con el scroll.
// ============================================================
(function initPersonaje() {
  const figure = document.querySelector('.hero__figure');
  const canvas = document.querySelector('.hero__canvas');
  if (!figure || !canvas) return;
  const ctx = canvas.getContext('2d');

  // desktop shows her up to ~100vh tall (often >1000 device px), so it gets
  // the full-resolution 1440x1080 set; tablets/phones only see her inside
  // the hero and get the lighter 960x720 set (less download, less memory).
  // The canvas matches the set so the browser never has to blow it up.
  const HD = window.innerWidth > 1100;
  const SET = HD ? 'hd' : 'sd';
  canvas.width = HD ? 1440 : 960;
  canvas.height = HD ? 1080 : 720;

  const FRAMES = 145;
  const imgs = new Array(FRAMES);
  let drawnImg = null;

  function draw(index) {
    const i = Math.max(0, Math.min(FRAMES - 1, Math.round(index)));
    // until the exact frame arrives, show the nearest one already loaded
    let im = imgs[i];
    for (let d = 1; !im && d < FRAMES; d++) im = imgs[i - d] || imgs[i + d];
    if (!im || im === drawnImg) return;
    if (!drawnImg) window.dispatchEvent(new Event('maca:firstframe'));   // loader progress
    drawnImg = im;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(im, 0, 0, canvas.width, canvas.height);
  }

  // first frame right away, then coarse-to-fine so scrubbing works early
  const order = [0];
  if (!prefersReducedMotion) {
    for (const step of [8, 4, 2, 1]) {
      for (let i = 0; i < FRAMES; i += step) if (!order.includes(i)) order.push(i);
    }
  }
  let target = { f: 0 };
  order.forEach((i) => {
    const im = new Image();
    im.decoding = 'async';
    im.onload = () => { imgs[i] = im; draw(target.f); };
    // ?v= busts the browser cache whenever the frame set is re-exported
    im.src = `assets/personaje/${SET}/f${String(i).padStart(3, '0')}.webp?v=4`;
  });

  if (prefersReducedMotion) return;   // static first frame, nothing moves

  const wrap = document.querySelector('.hero-scroll');
  const spark = document.querySelector('.spark');
  const obsesiones = document.querySelector('.obsesiones');
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function isTravel() {
    return window.innerWidth > 1100 && wrap && spark && obsesiones;
  }

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp01(v) { return Math.max(0, Math.min(1, v)); }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function docTop(el) { return el.getBoundingClientRect().top + window.scrollY; }

  // key poses along the page scroll (s in px). x/y are fractions of the
  // viewport, sc a scale, f the frame, o the opacity
  let keys = [];
  function measure() {
    const vh = window.innerHeight;
    const pinEnd = docTop(wrap) + wrap.offsetHeight - vh;
    const sparkMid = docTop(spark) + spark.offsetHeight / 2 - vh / 2;
    const obsTop = docTop(obsesiones);
    const obsH = obsesiones.offsetHeight;
    keys = [
      { s: 0,                           x: 0.2,   y: 0,    sc: 1,    f: 0,   o: 1 },
      { s: pinEnd * 0.5,                x: 0.1,   y: 0,    sc: 1,    f: 8,   o: 1 },
      // Manifiesto: a bit smaller so her hair clears "VER." and point 04
      { s: pinEnd,                      x: 0,     y: 0,    sc: 0.86, f: 22,  o: 1 },
      { s: Math.max(sparkMid, pinEnd + 1), x: -0.27, y: 0, sc: 1,    f: 42,  o: 1 },
      { s: obsTop + obsH * 0.35 - vh / 2, x: 0.26, y: 0,   sc: 0.82, f: 68,  o: 1 },
      { s: obsTop + obsH - vh,          x: 0.26,  y: 0,    sc: 0.82, f: 84,  o: 1 },
      // gone before the Personalidades cards (opaque boxes) scroll in
      { s: obsTop + obsH - vh * 0.5,    x: 0.3,   y: 0.25, sc: 0.78, f: 104, o: 0 },
    ];
    // keep the keys strictly increasing even on unusual layouts
    for (let k = 1; k < keys.length; k++) keys[k].s = Math.max(keys[k].s, keys[k - 1].s + 1);
  }

  function poseAt(s) {
    if (s <= keys[0].s) return keys[0];
    const last = keys[keys.length - 1];
    if (s >= last.s) return last;
    let k = 1;
    while (s > keys[k].s) k++;
    const a = keys[k - 1], b = keys[k];
    const t = (s - a.s) / (b.s - a.s);
    const e = smooth(t);
    return {
      x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), sc: lerp(a.sc, b.sc, e),
      o: lerp(a.o, b.o, e), f: lerp(a.f, b.f, t),
    };
  }

  // mobile/tablet: no travel, the hero just plays the first gestures as
  // it scrolls away (the CSS entrance + idle float keep running)
  function updateStatic() {
    const hero = document.querySelector('.hero');
    const p = clamp01(window.scrollY / (hero ? hero.offsetHeight : window.innerHeight));
    target.f = p * 40;
    draw(target.f);
  }

  let travel = false;
  let live = false;          // false until the CSS entrance animation is done
  const cur = { x: 0, y: 0, sc: 1, o: 1, f: 0 };
  const mouse = { x: 0, y: 0, cx: 0, cy: 0 };

  function goLive() {
    if (live || !travel) return;
    live = true;
    figure.style.animation = 'none';
  }

  function frame(time) {
    if (!travel) return;
    const pose = poseAt(window.scrollY);
    target = pose;
    // ease toward the scroll pose so fast wheel jumps still glide
    const k = 0.14;
    cur.x += (pose.x - cur.x) * k;
    cur.y += (pose.y - cur.y) * k;
    cur.sc += (pose.sc - cur.sc) * k;
    cur.o += (pose.o - cur.o) * k;
    cur.f += (pose.f - cur.f) * 0.25;
    mouse.cx += (mouse.x - mouse.cx) * 0.08;
    mouse.cy += (mouse.y - mouse.cy) * 0.08;
    draw(cur.f);

    // initHeroManifiesto may cancel the entrance animation first (on the
    // first scroll) — take over that same frame so she never blinks out
    if (!live && figure.style.animation === 'none') live = true;
    if (live) {
      const vw = window.innerWidth, vh = window.innerHeight;
      const float = Math.sin(time / 1100) * 6;   // replaces the CSS idle float
      const tx = cur.x * vw + mouse.cx;
      const ty = cur.y * vh + mouse.cy + float;
      figure.style.transform =
        `translateX(-50%) translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${cur.sc.toFixed(4)})`;
      figure.style.opacity = cur.o.toFixed(3);
      figure.style.visibility = cur.o < 0.01 ? 'hidden' : '';
    }
    requestAnimationFrame(frame);
  }

  function onMouse(e) {
    mouse.x = (e.clientX / window.innerWidth - 0.5) * 24;
    mouse.y = (e.clientY / window.innerHeight - 0.5) * 24;
  }

  function onStaticScroll() { requestAnimationFrame(updateStatic); }

  function sync() {
    const want = isTravel();
    if (want && !travel) {
      travel = true;
      document.body.classList.add('personaje-travel');
      window.removeEventListener('scroll', onStaticScroll);
      measure();
      // start exactly on the current pose (the CSS entrance already places
      // her there) so taking over never slides her in from the centre
      Object.assign(cur, poseAt(window.scrollY));
      pageRevealed.then(() => setTimeout(goLive, 1750));
      window.addEventListener('scroll', goLive, { passive: true, once: true });
      if (canHover) window.addEventListener('mousemove', onMouse, { passive: true });
      requestAnimationFrame(frame);
    } else if (!want && travel) {
      travel = false;
      live = false;
      document.body.classList.remove('personaje-travel');
      window.removeEventListener('mousemove', onMouse);
      figure.style.transform = '';
      figure.style.opacity = '';
      figure.style.visibility = '';
      figure.style.animation = '';
    }
    if (!travel) {
      window.addEventListener('scroll', onStaticScroll, { passive: true });
      updateStatic();
    } else {
      measure();
    }
  }

  sync();
  window.addEventListener('resize', sync);
  // fonts and images further down shift the section positions after load
  window.addEventListener('load', () => { if (travel) measure(); });
  if ('ResizeObserver' in window) {
    new ResizeObserver(() => { if (travel) measure(); }).observe(document.body);
  }
})();

// ============================================================
// EASTER EGGS — discretos, sólo en la página principal
// ============================================================
(function initEasterEggs() {
  const logo = document.querySelector('.nav__logo');
  const toast = document.getElementById('easterToast');
  if (logo && toast) {
    let clicks = 0;
    let resetTimer = null;
    logo.addEventListener('click', () => {
      clicks += 1;
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => { clicks = 0; }, 1500);
      if (clicks >= 5) {
        clicks = 0;
        toast.classList.add('is-visible');
        setTimeout(() => toast.classList.remove('is-visible'), 2600);
      }
    });
  }
})();
