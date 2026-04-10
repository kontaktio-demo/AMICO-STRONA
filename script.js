'use strict';

document.addEventListener('DOMContentLoaded', function () {
  initPreloader();
  initNav();
  initHamburger();
  initScrollReveal();
  initForm();
  initCookieConsent();
  initHeroSlider();
  initCarousel('realizacjeTrack');
  initCarousel('inspiracjeTrack');
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

function initHeroSlider() {
  var slides = document.querySelectorAll('.hero-slide');
  var dots   = document.querySelectorAll('.hero-dot');
  if (slides.length < 2) return;

  var current = 0;
  var interval = 5000;
  var timer;

  function goTo(index) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = index;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }

  function next() {
    goTo((current + 1) % slides.length);
  }

  function startAuto() {
    clearInterval(timer);
    timer = setInterval(next, interval);
  }

  dots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      var idx = parseInt(this.getAttribute('data-slide'), 10);
      goTo(idx);
      startAuto();
    });
  });

  startAuto();
}

function initCarousel(trackId) {
  var track = document.getElementById(trackId);
  if (!track) return;

  var wrapper = track.closest('.realizacje-carousel, .inspiracje-carousel');
  if (!wrapper) return;

  var prevBtn = wrapper.querySelector('.carousel-prev');
  var nextBtn = wrapper.querySelector('.carousel-next');
  var viewport = wrapper.querySelector('.carousel-viewport');

  var scrollAmount = 300;

  function getMaxScroll() {
    return track.scrollWidth - viewport.offsetWidth;
  }

  var offset = 0;

  function updatePosition() {
    var maxScroll = getMaxScroll();
    if (offset < 0) offset = 0;
    if (offset > maxScroll) offset = maxScroll;
    track.style.transform = 'translateX(-' + offset + 'px)';
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      offset -= scrollAmount;
      updatePosition();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      offset += scrollAmount;
      updatePosition();
    });
  }
}
