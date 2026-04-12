'use strict';

document.addEventListener('DOMContentLoaded', function () {
  initPreloader();
  initNav();
  initHamburger();
  initDropdowns();
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
    setTimeout(hide, 800);
  } else {
    window.addEventListener('load', function () { setTimeout(hide, 800); });
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

function initDropdowns() {
  var dropdowns = document.querySelectorAll('.nav-dropdown');
  if (!dropdowns.length) return;

  dropdowns.forEach(function (dropdown) {
    var toggle = dropdown.querySelector('.nav-dropdown-toggle');
    if (!toggle) return;

    toggle.addEventListener('click', function (e) {
      if (window.innerWidth <= 900) {
        e.preventDefault();
        dropdown.classList.toggle('open');
      }
    });

    dropdown.addEventListener('mouseenter', function () {
      if (window.innerWidth > 900) dropdown.classList.add('open');
    });
    dropdown.addEventListener('mouseleave', function () {
      if (window.innerWidth > 900) dropdown.classList.remove('open');
    });
  });

  document.addEventListener('click', function (e) {
    dropdowns.forEach(function (dropdown) {
      if (!dropdown.contains(e.target)) dropdown.classList.remove('open');
    });
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

  initFileUpload();

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

    /* reCAPTCHA check */
    var recaptchaError = document.getElementById('recaptchaError');
    if (recaptchaError) recaptchaError.classList.remove('show');
    if (typeof grecaptcha !== 'undefined') {
      var response = grecaptcha.getResponse();
      if (!response) {
        if (recaptchaError) recaptchaError.classList.add('show');
        hasError = true;
      }
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
        clearFileUpload();
        if (typeof grecaptcha !== 'undefined') grecaptcha.reset();
      }, 4000);
    }, 900);
  });
}

/* ─── File upload handling ─── */
var uploadedFiles = [];
var MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
var ALLOWED_EXTENSIONS = [
  'jpg','jpeg','png','webp','gif','bmp','tiff',
  'pdf','doc','docx',
  'obj','stl','fbx','step','stp','iges','igs','3ds','dxf','dwg','skp','blend'
];

function initFileUpload() {
  var zone = document.getElementById('fileUploadZone');
  var input = document.getElementById('fileInput');
  if (!zone || !input) return;

  /* Drag events */
  ['dragenter','dragover'].forEach(function (ev) {
    zone.addEventListener(ev, function (e) {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.add('dragover');
    });
  });
  ['dragleave','drop'].forEach(function (ev) {
    zone.addEventListener(ev, function (e) {
      e.preventDefault();
      e.stopPropagation();
      zone.classList.remove('dragover');
    });
  });

  zone.addEventListener('drop', function (e) {
    var files = e.dataTransfer.files;
    handleFiles(files);
  });

  input.addEventListener('change', function () {
    handleFiles(this.files);
    this.value = '';
  });
}

function handleFiles(fileList) {
  var errorEl = document.getElementById('fileUploadError');
  if (errorEl) { errorEl.classList.remove('show'); errorEl.textContent = ''; }

  for (var i = 0; i < fileList.length; i++) {
    var file = fileList[i];
    var ext = file.name.split('.').pop().toLowerCase();

    if (ALLOWED_EXTENSIONS.indexOf(ext) === -1) {
      showFileError('Nieobsługiwany format pliku: .' + ext);
      continue;
    }
    if (file.size > MAX_FILE_SIZE) {
      showFileError('Plik "' + file.name + '" przekracza 25 MB.');
      continue;
    }
    if (uploadedFiles.length >= 10) {
      showFileError('Maksymalnie 10 plików.');
      break;
    }

    uploadedFiles.push(file);
    renderFilePreview(file, uploadedFiles.length - 1);
  }
}

function showFileError(msg) {
  var errorEl = document.getElementById('fileUploadError');
  if (!errorEl) return;
  errorEl.textContent = msg;
  errorEl.classList.add('show');
}

function renderFilePreview(file, index) {
  var list = document.getElementById('filePreviewList');
  if (!list) return;

  var item = document.createElement('div');
  item.className = 'file-preview-item';
  item.setAttribute('data-index', index);

  var isImage = /\.(jpe?g|png|webp|gif|bmp|tiff)$/i.test(file.name);
  var thumbHTML = '';

  if (isImage) {
    var url = URL.createObjectURL(file);
    thumbHTML = '<img class="file-preview-thumb" src="' + url + '" alt="Podgląd">';
  } else {
    var ext = file.name.split('.').pop().toLowerCase();
    var icon = getFileIcon(ext);
    thumbHTML = '<div class="file-preview-icon">' + icon + '</div>';
  }

  var size = formatFileSize(file.size);
  var safeName = escapeHtml(file.name);

  item.innerHTML = thumbHTML +
    '<div class="file-preview-info">' +
      '<span class="file-preview-name" title="' + safeName + '">' + safeName + '</span>' +
      '<span class="file-preview-size">' + size + '</span>' +
    '</div>' +
    '<button type="button" class="file-preview-remove" title="Usuń plik" aria-label="Usuń ' + safeName + '">&times;</button>';

  item.querySelector('.file-preview-remove').addEventListener('click', function () {
    var idx = parseInt(item.getAttribute('data-index'), 10);
    uploadedFiles[idx] = null;
    item.style.animation = 'none';
    item.style.opacity = '0';
    item.style.transform = 'scale(.9)';
    item.style.transition = 'opacity .2s ease, transform .2s ease';
    setTimeout(function () { item.remove(); }, 200);
  });

  list.appendChild(item);
}

function clearFileUpload() {
  uploadedFiles = [];
  var list = document.getElementById('filePreviewList');
  if (list) list.innerHTML = '';
  var errorEl = document.getElementById('fileUploadError');
  if (errorEl) { errorEl.classList.remove('show'); errorEl.textContent = ''; }
}

function getFileIcon(ext) {
  if (['pdf'].indexOf(ext) !== -1)
    return '<svg viewBox="0 0 24 24"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z"/></svg>';
  if (['obj','stl','fbx','step','stp','iges','igs','3ds','blend','skp'].indexOf(ext) !== -1)
    return '<svg viewBox="0 0 24 24"><path d="M20.38 8.57l-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 15.58 6.85l1.85-1.23A10 10 0 0 0 3.35 19a2 2 0 0 0 1.72 1h13.85a2 2 0 0 0 1.74-1 10 10 0 0 0-.27-10.44zm-9.79 6.84a2 2 0 0 0 2.83 0l5.66-8.49-8.49 5.66a2 2 0 0 0 0 2.83z"/></svg>';
  if (['dxf','dwg'].indexOf(ext) !== -1)
    return '<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>';
  return '<svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>';
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function escapeHtml(str) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
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

  setTimeout(function () { consent.classList.add('show'); }, 1000);

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
  var interval = 4000;
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
    if (maxScroll <= 0) { offset = 0; }
    else if (offset > maxScroll) { offset = 0; }
    else if (offset < 0) { offset = maxScroll; }
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
