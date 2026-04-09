'use strict';

document.addEventListener('DOMContentLoaded', () => {
  initPreloader();
  initNav();
  initHamburger();
  initScrollReveal();
  initCounters();
  initForm();
  initStickyBar();
  initCookieConsent();
  initBackToTop();
  initParallaxSections();
  initGalleryFilter();
  initLightbox();
  initFaqAccordion();
  initMaterialTabs();
});

function initPreloader() {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;

  const hide = () => {
    preloader.classList.add('hidden');
    document.body.classList.remove('preloading');
  };

  const textEl = preloader.querySelector('.preloader-text');
  if (textEl) textEl.textContent = 'AMICO';

  if (document.readyState === 'complete') {
    setTimeout(hide, 800);
  } else {
    window.addEventListener('load', () => setTimeout(hide, 800));
  }
}

function initNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;

  const update = () => nav.classList.toggle('scrolled', window.scrollY > 60);
  window.addEventListener('scroll', update, { passive: true });
  update();
}

function initHamburger() {
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  if (!hamburger || !navLinks) return;

  const open = () => {
    hamburger.classList.add('open');
    navLinks.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  hamburger.addEventListener('click', () => {
    hamburger.classList.contains('open') ? close() : open();
  });

  navLinks.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', close));

  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  document.addEventListener('click', e => {
    if (navLinks.classList.contains('open') && !hamburger.contains(e.target) && !navLinks.contains(e.target)) close();
  });
}

function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -48px 0px' }
  );

  elements.forEach(el => observer.observe(el));

  window.__scrollRevealReset = () => {
    elements.forEach(el => {
      el.classList.remove('visible');
      observer.observe(el);
    });
  };
}

function initCounters() {
  const stats = document.querySelectorAll('.stat[data-count]');
  if (!stats.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);

        const el      = entry.target;
        const number  = el.querySelector('.stat-number');
        const target  = parseInt(el.dataset.count, 10);
        const suffix  = el.dataset.suffix || '';
        const dur     = 1600;
        const step    = 16;
        const steps   = dur / step;
        let   current = 0;

        const tick = () => {
          current = Math.min(current + target / steps, target);
          number.textContent = Math.floor(current) + suffix;
          if (current < target) requestAnimationFrame(tick);
          else el.classList.add('counted');
        };

        requestAnimationFrame(tick);
      });
    },
    { threshold: 0.5 }
  );

  stats.forEach(stat => observer.observe(stat));

  window.__counterReset = () => {
    stats.forEach(stat => {
      stat.classList.remove('counted');
      const number = stat.querySelector('.stat-number');
      if (number) number.textContent = '0' + (stat.dataset.suffix || '');
      observer.observe(stat);
    });
  };
}

function initForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();

    const btn      = form.querySelector('button[type="submit"]');
    const nameEl   = form.querySelector('#fname');
    const emailEl  = form.querySelector('#femail');
    const orig     = btn.textContent;
    const hasName  = nameEl.value.trim();
    const hasEmail = emailEl.value.trim();

    clearError(nameEl);
    clearError(emailEl);

    let hasError = false;
    if (!hasName)  { showError(nameEl,  'Wpisz swoje imię.');  hasError = true; }
    if (!hasEmail) { showError(emailEl, 'Wpisz swój e-mail.'); hasError = true; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(hasEmail)) {
      showError(emailEl, 'Wpisz poprawny adres e-mail.'); hasError = true;
    }

    if (hasError) {
      return;
    }

    btn.textContent = 'Wysyłanie...';
    btn.disabled = true;

    setTimeout(() => {
      btn.textContent = 'Wysłano';
      btn.style.background = 'linear-gradient(135deg,#c9a96e,#b8860b)';
      btn.style.color = '#fff';

      setTimeout(() => {
        btn.textContent = orig;
        btn.disabled = false;
        btn.style.background = '';
        btn.style.color = '';
        form.reset();
      }, 4000);
    }, 900);
  });
}

function showError(input, message) {
  input.style.borderColor = '#ef4444';
  input.style.boxShadow   = '0 0 0 3px rgba(239,68,68,.20)';
  const msg = document.createElement('span');
  msg.className = 'field-error';
  msg.setAttribute('role', 'alert');
  msg.textContent = message;
  msg.style.cssText = 'display:block;font-size:.75rem;color:#ef4444;margin-top:4px;';
  input.parentNode.appendChild(msg);

  input.addEventListener('input', () => clearError(input), { once: true });
}

function clearError(input) {
  input.style.borderColor = '';
  input.style.boxShadow   = '';
  const msg = input.parentNode.querySelector('.field-error');
  if (msg) msg.remove();
}

function shakeBtn() {
}

function initStickyBar() {
  const bar   = document.getElementById('stickyBar');
  const close = document.getElementById('stickyClose');
  if (!bar || !close) return;

  const KEY = 'kontaktio_sticky_closed';
  try { if (localStorage.getItem(KEY) === '1') return; } catch {}

  let shown = false;

  const update = () => {
    const should = window.scrollY > 900;
    if (should !== shown) {
      shown = should;
      bar.classList.toggle('on', should);
      bar.setAttribute('aria-hidden', String(!should));
    }
  };

  window.addEventListener('scroll', update, { passive: true });
  update();

  close.addEventListener('click', () => {
    bar.classList.remove('on');
    bar.setAttribute('aria-hidden', 'true');
    try { localStorage.setItem(KEY, '1'); } catch {}
    window.removeEventListener('scroll', update);
  });
}

function initCookieConsent() {
  const consent = document.getElementById('cookieConsent');
  if (!consent) return;
  if (localStorage.getItem('mww_cookie_consent')) return;

  setTimeout(() => consent.classList.add('show'), 1200);

  document.getElementById('cookieAccept').addEventListener('click', () => {
    localStorage.setItem('mww_cookie_consent', JSON.stringify({necessary:true, analytics:true, marketing:true}));
    consent.classList.remove('show');
  });

  document.getElementById('cookieReject').addEventListener('click', () => {
    localStorage.setItem('mww_cookie_consent', JSON.stringify({necessary:true, analytics:false, marketing:false}));
    consent.classList.remove('show');
  });

  document.getElementById('cookieCustomize').addEventListener('click', () => {
    const panel = document.getElementById('cookieCustomPanel');
    panel.hidden = !panel.hidden;
  });

  document.getElementById('cookieSave').addEventListener('click', () => {
    const analytics = document.getElementById('cookieAnalytics').checked;
    const marketing = document.getElementById('cookieMarketing').checked;
    localStorage.setItem('mww_cookie_consent', JSON.stringify({necessary:true, analytics, marketing}));
    consent.classList.remove('show');
  });
}

function initBackToTop() {
  const btn = document.createElement('button');
  btn.className = 'back-to-top';
  btn.setAttribute('aria-label', 'Wróć na górę');
  btn.innerHTML = '&#8679;';
  document.body.appendChild(btn);

  const toggle = () => btn.classList.toggle('visible', window.scrollY > 500);
  window.addEventListener('scroll', toggle, { passive: true });
  toggle();

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function initParallaxSections() {
  const bgs = document.querySelectorAll('.parallax-bg');
  if (!bgs.length) return;

  function update() {
    const scrollY = window.scrollY;
    bgs.forEach(el => {
      const rect = el.getBoundingClientRect();
      const speed = parseFloat(el.dataset.speed) || 0.3;
      const offset = (scrollY - el.offsetTop) * speed;
      el.style.backgroundPositionY = offset + 'px';
    });
  }

  window.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  update();
}

function initGalleryFilter() {
  const filters = document.querySelectorAll('[data-filter]');
  if (!filters.length) return;

  const items = document.querySelectorAll('.gallery-item');
  if (!items.length) return;

  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      filters.forEach(f => f.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      items.forEach(item => {
        if (filter === 'all' || item.dataset.category === filter) {
          item.style.display = '';
          requestAnimationFrame(() => item.classList.add('visible'));
        } else {
          item.classList.remove('visible');
          item.style.display = 'none';
        }
      });
    });
  });
}

function initLightbox() {
  const images = document.querySelectorAll('.gallery-item img, .lightbox-trigger');
  if (!images.length) return;

  let overlay = null;

  function open(src, alt) {
    overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML = '<img src="' + src + '" alt="' + (alt || '') + '">';
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('active'));

    overlay.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('active');
    overlay.addEventListener('transitionend', () => { if (overlay) { overlay.remove(); overlay = null; } });
    document.removeEventListener('keydown', onKey);
  }

  function onKey(e) { if (e.key === 'Escape') close(); }

  images.forEach(img => {
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => open(img.src, img.alt));
  });
}

function initFaqAccordion() {
  const items = document.querySelectorAll('.faq-item');
  if (!items.length) return;

  items.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (!question) return;

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      items.forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}

function initMaterialTabs() {
  const tabs = document.querySelectorAll('.material-tab');
  const panels = document.querySelectorAll('.material-panel');
  if (!tabs.length || !panels.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const target = tab.dataset.tab;
      panels.forEach(panel => {
        panel.classList.toggle('active', panel.id === target);
      });
    });
  });
}
