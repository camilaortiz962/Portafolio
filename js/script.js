document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Preloader ---------- */
  const preloader = document.getElementById('preloader');
  window.addEventListener('load', () => {
    setTimeout(() => preloader.classList.add('done'), 400);
  });
  // Fallback in case 'load' already fired
  setTimeout(() => preloader.classList.add('done'), 1800);

  /* ---------- Navbar scroll state ---------- */
  const navbar = document.getElementById('navbar');
  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  navToggle.addEventListener('click', () => {
    const isOpen = navToggle.classList.toggle('open');
    navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
  });
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('open');
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Abrir menú');
    });
  });

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  revealEls.forEach(el => revealObserver.observe(el));

  /* ---------- Custom cursor (contextual: Ver / Abrir → / arrow) ---------- */
  const cursorDot = document.getElementById('cursorDot');
  const cursorLabel = document.getElementById('cursorLabel');
  const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  if (!isTouchDevice) {
    window.addEventListener('mousemove', (e) => {
      cursorDot.style.left = e.clientX + 'px';
      cursorDot.style.top = e.clientY + 'px';
      cursorDot.classList.add('active');
    });

    const setCursorLabel = (text) => {
      if (text) {
        cursorLabel.textContent = text;
        cursorDot.classList.add('labeled');
        cursorDot.classList.remove('grow');
      } else {
        cursorDot.classList.remove('labeled');
      }
    };

    const verNodes = document.querySelectorAll('.gallery-item:not(.category-card):not(.gallery-item--external)');
    const abrirNodes = document.querySelectorAll('.category-card, .gallery-item--external');
    const labeledNodes = new Set([...verNodes, ...abrirNodes]);

    verNodes.forEach(el => {
      el.addEventListener('mouseenter', () => setCursorLabel('Ver'));
      el.addEventListener('mouseleave', () => setCursorLabel(null));
    });
    abrirNodes.forEach(el => {
      el.addEventListener('mouseenter', () => setCursorLabel('Abrir →'));
      el.addEventListener('mouseleave', () => setCursorLabel(null));
    });
    document.querySelectorAll('a, button').forEach(el => {
      if (labeledNodes.has(el)) return;
      el.addEventListener('mouseenter', () => cursorDot.classList.add('grow'));
      el.addEventListener('mouseleave', () => cursorDot.classList.remove('grow'));
    });
  }

  /* ---------- Gallery lightbox ---------- */
  const lightbox = document.getElementById('lightbox');
  const lightboxMedia = document.getElementById('lightboxMedia');
  const lightboxCat = document.getElementById('lightboxCat');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxDesc = document.getElementById('lightboxDesc');
  const lightboxClose = document.getElementById('lightboxClose');

  /* Standard project detail (non-catalog): title + clean image + info below, no overlay. */
  const lightboxProject = document.getElementById('lightboxProject');
  const lbpCat = document.getElementById('lbpCat');
  const lbpTitle = document.getElementById('lbpTitle');
  const lbpHero = document.getElementById('lbpHero');
  const lbpInfo = document.getElementById('lbpInfo');
  const lbpGallery = document.getElementById('lbpGallery');

  const parseProjectInfo = (desc) => {
    if (!desc) return [];
    return desc.split('\n').map(line => {
      const idx = line.indexOf(' — ');
      if (idx === -1) return null;
      return { label: line.slice(0, idx).trim(), value: line.slice(idx + 3).trim() };
    }).filter(Boolean);
  };

  document.querySelectorAll('.gallery-item:not(.category-card):not(.gallery-item--external)').forEach(item => {
    item.addEventListener('click', () => {
      const mediaSrc = item.dataset.media;
      const mediaType = item.dataset.mediaType || 'image';
      const title = item.dataset.title || '';

      lbpHero.innerHTML = '';
      if (mediaSrc) {
        if (mediaType === 'video') {
          const video = document.createElement('video');
          video.src = mediaSrc;
          video.controls = true;
          lbpHero.appendChild(video);
        } else {
          const img = document.createElement('img');
          img.src = mediaSrc;
          img.alt = title;
          lbpHero.appendChild(img);
        }
      }

      lbpCat.textContent = item.dataset.cat || '';
      lbpTitle.textContent = title;

      lbpInfo.innerHTML = '';
      parseProjectInfo(item.dataset.desc).forEach(({ label, value }) => {
        const block = document.createElement('div');
        block.className = 'project-standard__info-block';
        const dt = document.createElement('span');
        dt.className = 'project-standard__info-label';
        dt.textContent = label;
        const dd = document.createElement('p');
        dd.textContent = value;
        block.appendChild(dt);
        block.appendChild(dd);
        lbpInfo.appendChild(block);
      });

      lbpGallery.innerHTML = '';
      if (item.dataset.gallery) {
        item.dataset.gallery.split(',').map(s => s.trim()).filter(Boolean).forEach(src => {
          const img = document.createElement('img');
          img.src = src;
          img.alt = title;
          img.loading = 'lazy';
          lbpGallery.appendChild(img);
        });
      }

      lightbox.classList.add('open', 'mode-project');
      document.body.style.overflow = 'hidden';
    });
  });

  const closeLightbox = () => {
    lightbox.classList.remove('open', 'mode-project');
    lightboxMedia.classList.remove('zoomed');
    lightboxMedia.querySelectorAll('video').forEach(v => v.pause());
    lbpHero.querySelectorAll('video').forEach(v => v.pause());
    document.body.style.overflow = '';
  };
  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  /* ---------- Lightbox zoom (click image to toggle full-size + scroll) ---------- */
  lightboxMedia.addEventListener('click', (e) => {
    if (e.target.tagName === 'IMG') {
      lightboxMedia.classList.toggle('zoomed');
      if (!lightboxMedia.classList.contains('zoomed')) {
        lightboxMedia.scrollTop = 0;
        lightboxMedia.scrollLeft = 0;
      }
    } else if (e.target === lightboxMedia) {
      closeLightbox();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  /* ---------- Full catalog carousels ---------- */
  const carousels = document.querySelectorAll('.carousel[data-base]');
  let activeCarousel = null;

  const pad2 = (n) => String(n).padStart(2, '0');

  carousels.forEach(root => {
    const base = root.dataset.base;
    const count = parseInt(root.dataset.count, 10);
    const label = root.dataset.label || '';
    let current = 1; // 1-indexed

    const img = root.querySelector('.carousel-img');
    const prevBtn = root.querySelector('.carousel-prev');
    const nextBtn = root.querySelector('.carousel-next');
    const zoomBtn = root.querySelector('.carousel-zoom');
    const currentEl = root.querySelector('.carousel-current');
    const totalEl = root.querySelector('.carousel-total');
    const progressBar = root.querySelector('.carousel-progress-bar');
    const thumbsWrap = root.querySelector('.carousel-thumbs');

    totalEl.textContent = pad2(count);
    const pageCountEl = root.closest('.catalog-block')?.querySelector('.catalog-page-count-num');
    if (pageCountEl) pageCountEl.textContent = count;

    const srcFor = (idx) => `${base}${pad2(idx)}.jpg`;

    // Build thumbnails (count calculated from data-count, never hardcoded)
    const thumbs = [];
    for (let i = 1; i <= count; i++) {
      const thumb = document.createElement('button');
      thumb.type = 'button';
      thumb.className = 'carousel-thumb';
      thumb.setAttribute('aria-label', `Ir a página ${i}`);
      const thumbImg = document.createElement('img');
      thumbImg.src = srcFor(i);
      thumbImg.loading = 'lazy';
      thumbImg.alt = `${label} — miniatura página ${i}`;
      thumb.appendChild(thumbImg);
      thumb.addEventListener('click', () => goTo(i));
      thumbsWrap.appendChild(thumb);
      thumbs.push(thumb);
    }

    const preload = (idx) => {
      if (idx < 1 || idx > count) return;
      const pre = new Image();
      pre.src = srcFor(idx);
    };

    const render = () => {
      img.classList.add('fading');
      setTimeout(() => {
        img.src = srcFor(current);
        img.alt = `${label} — página ${current} de ${count}`;
        img.classList.remove('fading');
      }, 120);

      currentEl.textContent = pad2(current);
      progressBar.style.width = count > 1 ? `${((current - 1) / (count - 1)) * 100}%` : '100%';
      prevBtn.disabled = current === 1;
      nextBtn.disabled = current === count;

      thumbs.forEach((t, i) => t.classList.toggle('active', i + 1 === current));
      const activeThumb = thumbs[current - 1];
      if (activeThumb) activeThumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });

      preload(current - 1);
      preload(current + 1);
    };

    const goTo = (idx) => {
      if (idx < 1 || idx > count || idx === current) return;
      current = idx;
      render();
    };

    prevBtn.addEventListener('click', () => goTo(current - 1));
    nextBtn.addEventListener('click', () => goTo(current + 1));

    const openZoom = () => {
      lightboxMedia.innerHTML = '';
      lightboxMedia.classList.remove('zoomed');
      const zoomImg = document.createElement('img');
      zoomImg.src = srcFor(current);
      zoomImg.alt = `${label} — página ${current} de ${count}`;
      lightboxMedia.appendChild(zoomImg);
      lightboxCat.textContent = 'Catálogo de producto';
      lightboxTitle.textContent = `${label} — Página ${pad2(current)} / ${pad2(count)}`;
      lightboxDesc.textContent = '';
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    zoomBtn.addEventListener('click', openZoom);
    img.addEventListener('click', openZoom);

    // Touch swipe
    let touchStartX = null;
    const viewport = root.querySelector('.carousel-viewport');
    viewport.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
    viewport.addEventListener('touchend', (e) => {
      if (touchStartX === null) return;
      const deltaX = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(deltaX) > 40) {
        if (deltaX < 0) goTo(current + 1);
        else goTo(current - 1);
      }
      touchStartX = null;
    }, { passive: true });

    // Track which carousel is most in view, for keyboard navigation
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.4) activeCarousel = { goTo, get current() { return current; } };
      });
    }, { threshold: [0.4, 0.6] });
    io.observe(root);

    render();
  });

  if (carousels.length) {
    document.addEventListener('keydown', (e) => {
      if (!activeCarousel || lightbox.classList.contains('open')) return;
      if (e.key === 'ArrowLeft') activeCarousel.goTo(activeCarousel.current - 1);
      if (e.key === 'ArrowRight') activeCarousel.goTo(activeCarousel.current + 1);
    });
  }

  /* ---------- Floating labels: keep label up if field has value ---------- */
  document.querySelectorAll('.form-field input, .form-field textarea').forEach(field => {
    field.setAttribute('placeholder', ' ');
  });

  /* ---------- Contact form: envío a Formspree vía fetch ---------- */
  const form = document.getElementById('contactForm');
  const formNote = document.getElementById('formNote');
  if (form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const submitBtnLabel = submitBtn.textContent;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';
      formNote.classList.remove('form-note--error');
      formNote.textContent = '';

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          formNote.textContent = '¡Mensaje enviado! Gracias por escribirme. Me pondré en contacto contigo pronto.';
          form.reset();
        } else {
          formNote.classList.add('form-note--error');
          formNote.textContent = 'No se pudo enviar. Hubo un problema al enviar el mensaje. Inténtalo nuevamente o escríbeme a mariacamilaortizherrera@gmail.com.';
        }
      } catch (error) {
        formNote.classList.add('form-note--error');
        formNote.textContent = 'No se pudo enviar. Revisa tu conexión e inténtalo nuevamente, o escríbeme a mariacamilaortizherrera@gmail.com.';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtnLabel;
      }
    });
  }

});
