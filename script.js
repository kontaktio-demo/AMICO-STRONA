'use strict';

document.addEventListener('DOMContentLoaded', function () {
  initPreloader();
  initNav();
  initHamburger();
  initScrollReveal();
  initCounters();
  initForm();
  initCookieConsent();
});

function initPreloader() {
  var preloader = document.getElementById('preloader');
  if (!preloader) return;

  var hide = function () {
    preloader.classList.add('hidden');
    document.body.classList.remove('preloading');
  };

  if (document.readyState === 'complete') {
    setTimeout(hide, 1200);
  } else {
    window.addEventListener('load', function () { setTimeout(hide, 1200); });
  }
}

function initNav() {
  var nav = document.getElementById('nav');
  if (!nav) return;

  var update = function () { nav.classList.toggle('scrolled', window.scrollY > 60); };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

function initHamburger() {
  var hamburger = document.getElementById('hamburger');
  var navLinks  = document.getElementById('navLinks');
  if (!hamburger || !navLinks) return;

  var open = function () {
    hamburger.classList.add('open');
    navLinks.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };

  var close = function () {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  hamburger.addEventListener('click', function () {
    hamburger.classList.contains('open') ? close() : open();
  });

  navLinks.querySelectorAll('.nav-link').forEach(function (link) {
    link.addEventListener('click', close);
  });

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  document.addEventListener('click', function (e) {
    if (navLinks.classList.contains('open') && !hamburger.contains(e.target) && !navLinks.contains(e.target)) close();
  });
}

function initScrollReveal() {
  var elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -48px 0px' }
  );

  elements.forEach(function (el) { observer.observe(el); });

  window.__scrollRevealReset = function () {
    elements.forEach(function (el) {
      el.classList.remove('visible');
      observer.observe(el);
    });
  };
}

function initCounters() {
  var stats = document.querySelectorAll('.stat[data-count]');
  if (!stats.length) return;

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);

        var el      = entry.target;
        var number  = el.querySelector('.stat-number');
        var target  = parseInt(el.dataset.count, 10);
        var suffix  = el.dataset.suffix || '';
        var dur     = 1800;
        var step    = 16;
        var steps   = dur / step;
        var current = 0;

        var tick = function () {
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

  stats.forEach(function (stat) { observer.observe(stat); });

  window.__counterReset = function () {
    stats.forEach(function (stat) {
      stat.classList.remove('counted');
      var number = stat.querySelector('.stat-number');
      if (number) number.textContent = '0' + (stat.dataset.suffix || '');
      observer.observe(stat);
    });
  };
}

function initForm() {
  var form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var btn      = form.querySelector('button[type="submit"]');
    var nameEl   = form.querySelector('#fname');
    var emailEl  = form.querySelector('#femail');
    var orig     = btn.textContent;
    var hasName  = nameEl.value.trim();
    var hasEmail = emailEl.value.trim();

    clearError(nameEl);
    clearError(emailEl);

    var hasError = false;
    if (!hasName)  { showError(nameEl,  'Wpisz swoje imię.');  hasError = true; }
    if (!hasEmail) { showError(emailEl, 'Wpisz swój e-mail.'); hasError = true; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(hasEmail)) {
      showError(emailEl, 'Wpisz poprawny adres e-mail.'); hasError = true;
    }

    if (hasError) return;

    btn.textContent = 'Wysyłanie...';
    btn.disabled = true;

    setTimeout(function () {
      btn.textContent = 'Wysłano ✓';
      btn.style.background = '#22c55e';
      btn.style.borderColor = '#22c55e';
      btn.style.color = '#fff';

      setTimeout(function () {
        btn.textContent = orig;
        btn.disabled = false;
        btn.style.background = '';
        btn.style.borderColor = '';
        btn.style.color = '';
        form.reset();
      }, 4000);
    }, 900);
  });
}

function showError(input, message) {
  input.style.borderColor = '#ef4444';
  input.style.boxShadow   = '0 0 0 3px rgba(239,68,68,.20)';
  var msg = document.createElement('span');
  msg.className = 'field-error';
  msg.setAttribute('role', 'alert');
  msg.textContent = message;
  msg.style.cssText = 'display:block;font-size:.75rem;color:#ef4444;margin-top:4px;';
  input.parentNode.appendChild(msg);

  input.addEventListener('input', function () { clearError(input); }, { once: true });
}

function clearError(input) {
  input.style.borderColor = '';
  input.style.boxShadow   = '';
  var msg = input.parentNode.querySelector('.field-error');
  if (msg) msg.remove();
}

function initCookieConsent() {
  var consent = document.getElementById('cookieConsent');
  if (!consent) return;
  try { if (localStorage.getItem('amico_cookie_consent')) return; } catch (e) { /* empty */ }

  setTimeout(function () { consent.classList.add('show'); }, 1500);

  document.getElementById('cookieAccept').addEventListener('click', function () {
    localStorage.setItem('amico_cookie_consent', JSON.stringify({necessary:true, analytics:true, marketing:true}));
    consent.classList.remove('show');
  });

  document.getElementById('cookieReject').addEventListener('click', function () {
    localStorage.setItem('amico_cookie_consent', JSON.stringify({necessary:true, analytics:false, marketing:false}));
    consent.classList.remove('show');
  });

  document.getElementById('cookieCustomize').addEventListener('click', function () {
    var panel = document.getElementById('cookieCustomPanel');
    panel.hidden = !panel.hidden;
  });

  document.getElementById('cookieSave').addEventListener('click', function () {
    var analytics = document.getElementById('cookieAnalytics').checked;
    var marketing = document.getElementById('cookieMarketing').checked;
    localStorage.setItem('amico_cookie_consent', JSON.stringify({necessary:true, analytics: analytics, marketing: marketing}));
    consent.classList.remove('show');
  });
}
