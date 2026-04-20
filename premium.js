'use strict';

/* AMICO — premium homepage interactions */
(function () {

  var prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Hero subtle parallax ---------- */
  function initHeroParallax() {
    if (prefersReduce) return;
    var hero = document.querySelector('.hero-premium');
    if (!hero) return;
    var bg = hero.querySelector('[data-hero-parallax]');
    if (!bg) return;

    var ticking = false;
    function update() {
      var rect = hero.getBoundingClientRect();
      var max  = hero.offsetHeight;
      if (rect.bottom < 0 || rect.top > window.innerHeight) { ticking = false; return; }
      var y = Math.max(-max, Math.min(0, rect.top));
      var shift = (-y) * 0.18;
      bg.style.transform = 'scale(1.08) translate3d(0,' + shift.toFixed(1) + 'px,0)';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ---------- Hero staged reveal ---------- */
  function initHeroReveal() {
    var hero = document.querySelector('.hero-premium');
    if (!hero) return;
    function ready() { hero.classList.add('is-ready'); }
    if (document.body.classList.contains('preloading')) {
      var obs = new MutationObserver(function () {
        if (!document.body.classList.contains('preloading')) { ready(); obs.disconnect(); }
      });
      obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
      setTimeout(ready, 1800);
    } else {
      requestAnimationFrame(ready);
    }
  }

  /* ---------- Premium contact form (homepage) ---------- */
  function initHomeForm() {
    var form = document.getElementById('homeContactForm');
    if (!form) return;
    var btn = form.querySelector('button[type="submit"]');
    var orig = btn ? btn.textContent : '';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nameEl  = form.querySelector('[name="name"]');
      var emailEl = form.querySelector('[name="email"]');
      var ok = true;
      [nameEl, emailEl].forEach(function (el) {
        if (!el) return;
        if (!el.value.trim()) {
          el.style.borderBottomColor = '#ff7a7a';
          el.addEventListener('input', function clr() {
            el.style.borderBottomColor = '';
            el.removeEventListener('input', clr);
          });
          ok = false;
        }
      });
      if (emailEl && emailEl.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
        emailEl.style.borderBottomColor = '#ff7a7a';
        emailEl.addEventListener('input', function clr() {
          emailEl.style.borderBottomColor = '';
          emailEl.removeEventListener('input', clr);
        });
        ok = false;
      }
      if (!ok) return;

      if (btn) { btn.disabled = true; btn.textContent = 'Wysyłanie…'; }
      setTimeout(function () {
        if (btn) { btn.textContent = 'Dziękujemy — odezwiemy się'; }
        form.reset();
        setTimeout(function () {
          if (btn) { btn.disabled = false; btn.textContent = orig; }
        }, 3200);
      }, 700);
    });
  }

  function init() {
    initHeroReveal();
    initHeroParallax();
    initHomeForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
