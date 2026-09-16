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
  '.spark, .obsesiones, .personalidades, .archivo, .experiment-lab'
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

// elements that animate themselves directly (no shared .reveal base state)
const directRevealTargets = document.querySelectorAll('.contacto__figure');
const directIo = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      directIo.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
directRevealTargets.forEach(el => directIo.observe(el));

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
  setTimeout(clearEntranceAnimations, 1700);

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp01(v) { return Math.max(0, Math.min(1, v)); }

  // hero rest geometry → the Manifiesto avatar's own rest geometry,
  // both expressed in vh against the same 100vh pinned viewport
  const HERO_TOP = 22, HERO_HEIGHT = 150;
  // top:11vh (not 4) so the avatar's top edge clears the fixed nav, which
  // has an opaque background by the time this section is ever visible —
  // matches the manifiesto padding-top bump below for the same reason
  const TARGET_TOP = 11, TARGET_HEIGHT = 89;

  const eyebrow = manifiesto.querySelector(':scope > .eyebrow--line');
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
    wordmark.style.transform = `translateX(-50%) scale(${wordmarkScale.toFixed(4)})`;
    wordmark.style.opacity = (1 - p).toFixed(3);

    figure.style.top = lerp(HERO_TOP, TARGET_TOP, p).toFixed(3) + 'vh';
    figure.style.height = lerp(HERO_HEIGHT, TARGET_HEIGHT, p).toFixed(3) + 'vh';
    // the base rule's opacity:0 only exists to support the entrance fade-in;
    // once that animation is cleared there's nothing left to hold opacity
    // at 1, so pin it here for the whole scroll-driven phase
    figure.style.opacity = '1';

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
// CATEGORÍAS — scroll vertical → desplazamiento horizontal
// ============================================================
// PRIORIDAD 1. A tall wrapper (.categorias, 500vh) provides the scroll
// distance; .categorias__pin stays pinned via CSS position:sticky; this
// script reads how far the wrapper has scrolled past the viewport top
// and maps that progress (0→1) onto a translateX of the flex track, so
// scrolling down visually reads as moving right through the categories.
(function initCategoriasScroll() {
  const wrap = document.querySelector('.categorias');
  const track = document.getElementById('categoriasTrack');
  if (!wrap || !track) return;

  const panels = Array.from(track.children);
  const dots = document.querySelectorAll('.categorias__dot');
  const n = panels.length;
  let active = -1;
  let enabled = false;

  function isDesktop() {
    return window.innerWidth >= 901 && !prefersReducedMotion;
  }

  function setActive(index) {
    if (index === active) return;
    active = index;
    panels.forEach((p, i) => p.classList.toggle('is-active', i === index));
    dots.forEach((d, i) => d.classList.toggle('is-active', i === index));
  }

  function update() {
    if (!enabled) return;
    const rect = wrap.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    let progress = total > 0 ? -rect.top / total : 0;
    progress = Math.max(0, Math.min(1, progress));
    const shiftVw = progress * (n - 1) * 100;
    track.style.transform = `translate3d(-${shiftVw}vw,0,0)`;
    setActive(Math.round(progress * (n - 1)));
  }

  function onScroll() {
    requestAnimationFrame(update);
  }

  function sync() {
    const desktop = isDesktop();
    if (desktop && !enabled) {
      enabled = true;
      window.addEventListener('scroll', onScroll, { passive: true });
      update();
    } else if (!desktop && enabled) {
      enabled = false;
      window.removeEventListener('scroll', onScroll);
      track.style.transform = 'none';
      panels.forEach(p => p.classList.remove('is-active'));
      dots.forEach(d => d.classList.remove('is-active'));
      active = -1;
    }
  }

  sync();
  update();
  if (isDesktop()) setActive(0);
  window.addEventListener('resize', sync);
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
// HERO AVATAR — parallax sutil al cursor (desktop, puntero fino,
// respeta prefers-reduced-motion). .hero__figure nunca recibe un
// transform inline desde initHeroManifiesto (solo top/height/opacity),
// así que esto no compite con el scroll-jack — sólo compone sobre el
// translateX(-50%) fijo que ya trae por CSS.
// ============================================================
(function initHeroParallax() {
  const figure = document.querySelector('.hero__figure');
  if (!figure) return;
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!canHover || prefersReducedMotion) return;

  const MAX = 12;
  let raf = null;

  window.addEventListener('mousemove', (e) => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = null;
      if (window.innerWidth <= 1100) { figure.style.transform = ''; return; }
      const dx = (e.clientX / window.innerWidth - 0.5) * MAX * 2;
      const dy = (e.clientY / window.innerHeight - 0.5) * MAX * 2;
      figure.style.transform = `translateX(-50%) translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
    });
  }, { passive: true });
})();

// ============================================================
// EASTER EGGS — discretos, sólo en la página principal
// ============================================================
(function initEasterEggs() {
  const statusToggle = document.getElementById('systemStatusToggle');
  const statusPanel = document.getElementById('systemStatusPanel');
  if (statusToggle && statusPanel) {
    statusToggle.addEventListener('click', () => {
      const open = statusPanel.hasAttribute('hidden');
      if (open) statusPanel.removeAttribute('hidden');
      else statusPanel.setAttribute('hidden', '');
      statusToggle.setAttribute('aria-expanded', String(open));
    });
  }

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
