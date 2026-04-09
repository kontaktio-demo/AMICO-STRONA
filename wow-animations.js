'use strict';

(function () {

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  var TILT_MAX_DEG = 5;
  var MAGNETIC_STRENGTH = 0.15;
  var HERO_PARALLAX_FACTOR = 0.4;

  var enhancedObserver;
  var enhancedElements;

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function initEnhancedReveal() {
    var selectors = [
      '.reveal-left', '.reveal-right', '.reveal-scale',
      '.reveal-flip', '.reveal-blur', '.reveal-rotate', '.reveal-zoom',
      '.section-header', '.listing-card'
    ];
    enhancedElements = document.querySelectorAll(selectors.join(','));
    if (!enhancedElements.length) return;

    enhancedObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            enhancedObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    enhancedElements.forEach(function (el) { enhancedObserver.observe(el); });
  }

  function initTiltCards() {
    if (!isDesktop) return;

    var cards = document.querySelectorAll(
      '.dist-card, .testimonial-card, .partner-card, .listing-card'
    );

    cards.forEach(function (card) {
      card.classList.add('tilt-3d');

      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var midX = rect.width / 2;
        var midY = rect.height / 2;
        var rotateY = ((x - midX) / midX) * TILT_MAX_DEG;
        var rotateX = ((midY - y) / midY) * TILT_MAX_DEG;

        card.style.transform =
          'perspective(800px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-6px) scale(1.01)';
      });

      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
      });
    });
  }

  function initMagneticButtons() {
    if (!isDesktop) return;

    var buttons = document.querySelectorAll('.btn-primary, .btn-outline');

    buttons.forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform =
          'translate(' + (x * MAGNETIC_STRENGTH) + 'px,' + (y * MAGNETIC_STRENGTH) + 'px) translateY(-3px) scale(1.02)';
      });

      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  }

  function initHeroParallax() {
    var hero = document.querySelector('.hero');
    if (!hero) return;

    var heroContent = hero.querySelector('.hero-content');
    var heroScroll = hero.querySelector('.hero-scroll');

    function update() {
      var scrollY = window.scrollY;
      var heroH = hero.offsetHeight;

      if (scrollY > heroH * 1.5) return;

      hero.style.backgroundPositionY = (scrollY * HERO_PARALLAX_FACTOR) + 'px';

      if (heroContent) {
        heroContent.style.transform =
          'translateY(' + (scrollY * -0.15) + 'px)';
        heroContent.style.opacity =
          clamp(1 - scrollY / (heroH * 0.7), 0, 1);
      }

      if (heroScroll) {
        heroScroll.style.opacity =
          clamp(1 - scrollY / 200, 0, 1);
      }
    }

    window.addEventListener('scroll', function () {
      requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  function initScrollProgress() {
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    function update() {
      var scrollTop = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var progress = docHeight > 0 ? scrollTop / docHeight : 0;
      bar.style.transform = 'scaleX(' + progress + ')';
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  function initStatGlow() {
    var stats = document.querySelectorAll('.stat');
    if (!stats.length) return;

    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.type === 'attributes' && m.attributeName === 'class') {
          var el = m.target;
          if (el.classList.contains('counted')) {
            el.style.transition = 'background .6s ease';
            el.style.background = 'rgba(26,26,26,.02)';
            setTimeout(function () {
              el.style.background = '';
            }, 1200);
          }
        }
      });
    });

    stats.forEach(function (stat) {
      observer.observe(stat, { attributes: true });
    });
  }

  function initHeroTyping() {
    var eyebrow = document.querySelector('.hero-eyebrow');
    if (!eyebrow) return;

    var cursor = document.createElement('span');
    cursor.textContent = '|';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.style.cssText =
      'display:inline-block;margin-left:4px;animation:blink 1s step-end infinite;font-weight:300;opacity:.6;';

    eyebrow.appendChild(cursor);

    setTimeout(function () {
      cursor.style.transition = 'opacity .5s';
      cursor.style.opacity = '0';
      setTimeout(function () { cursor.remove(); }, 600);
    }, 4000);
  }

  function resetAllAnimations() {
    document.querySelectorAll('.reveal.visible').forEach(function (el) {
      el.classList.remove('visible');
    });
    document.querySelectorAll('.section-header.visible').forEach(function (el) {
      el.classList.remove('visible');
    });

    if (enhancedObserver && enhancedElements) {
      enhancedElements.forEach(function (el) {
        enhancedObserver.observe(el);
      });
    }

    if (window.__scrollRevealReset) window.__scrollRevealReset();
    if (window.__counterReset) window.__counterReset();
  }

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var id = this.getAttribute('href');
        if (id === '#') return;
        var target = document.querySelector(id);
        if (!target) return;

        e.preventDefault();
        var navHeight = 72;
        var top = target.getBoundingClientRect().top + window.scrollY - navHeight;

        resetAllAnimations();

        window.scrollTo({
          top: top,
          behavior: 'smooth'
        });
      });
    });
  }

  function boot() {
    initEnhancedReveal();
    initTiltCards();
    initMagneticButtons();
    initHeroParallax();
    initScrollProgress();
    initStatGlow();
    initHeroTyping();
    initSmoothScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
