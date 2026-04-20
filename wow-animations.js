"use strict";

(function() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var isDesktop = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var TILT_MAX_DEG = 4;
  var MAGNETIC_STRENGTH = .12;
  var HERO_PARALLAX_FACTOR = .3;
  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }
  function initEnhancedReveal() {
    var selectors = [ ".reveal-left", ".reveal-right", ".reveal-scale", ".reveal-blur", ".section-header" ];
    var enhancedElements = document.querySelectorAll(selectors.join(","));
    if (!enhancedElements.length) return;
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: .08,
      rootMargin: "0px 0px -40px 0px"
    });
    enhancedElements.forEach(function(el) {
      observer.observe(el);
    });
  }
  function initTiltCards() {
    if (!isDesktop) return;
    var cards = document.querySelectorAll(".feature-card, .why-card, .carousel-card, .inspiration-slide");
    cards.forEach(function(card) {
      card.classList.add("tilt-3d");
      card.addEventListener("mousemove", function(e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var midX = rect.width / 2;
        var midY = rect.height / 2;
        var rotateY = (x - midX) / midX * TILT_MAX_DEG;
        var rotateX = (midY - y) / midY * TILT_MAX_DEG;
        card.style.transform = "perspective(800px) rotateX(" + rotateX + "deg) rotateY(" + rotateY + "deg) translateY(-6px) scale(1.01)";
      });
      card.addEventListener("mouseleave", function() {
        card.style.transform = "";
      });
    });
  }
  function initMagneticButtons() {
    if (!isDesktop) return;
    var buttons = document.querySelectorAll(".btn-primary, .btn-outline");
    buttons.forEach(function(btn) {
      btn.addEventListener("mousemove", function(e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = "translate(" + x * MAGNETIC_STRENGTH + "px," + y * MAGNETIC_STRENGTH + "px)";
      });
      btn.addEventListener("mouseleave", function() {
        btn.style.transform = "";
      });
    });
  }
  function initHeroParallax() {
    var hero = document.querySelector(".hero-slider");
    if (!hero) return;
    function update() {
      var scrollY = window.scrollY;
      var heroH = hero.offsetHeight;
      if (scrollY > heroH * 1.5) return;
    }
    window.addEventListener("scroll", function() {
      requestAnimationFrame(update);
    }, {
      passive: true
    });
    update();
  }
  function initParallaxDividers() {
    var dividers = document.querySelectorAll(".parallax-divider");
    if (!dividers.length) return;
    function update() {
      dividers.forEach(function(div) {
        var rect = div.getBoundingClientRect();
        var winH = window.innerHeight;
        if (rect.top > winH || rect.bottom < 0) return;
        var progress = (winH - rect.top) / (winH + rect.height);
        var shift = (progress - .5) * 40;
        var content = div.querySelector(".parallax-divider-content");
        if (content) {
          content.style.transform = "translateY(" + shift + "px)";
        }
      });
    }
    window.addEventListener("scroll", function() {
      requestAnimationFrame(update);
    }, {
      passive: true
    });
    update();
  }
  function initScrollProgress() {
    var bar = document.createElement("div");
    bar.className = "scroll-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);
    function update() {
      var scrollTop = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var progress = docHeight > 0 ? scrollTop / docHeight : 0;
      bar.style.transform = "scaleX(" + progress + ")";
    }
    window.addEventListener("scroll", update, {
      passive: true
    });
    update();
  }
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
      anchor.addEventListener("click", function(e) {
        var id = this.getAttribute("href");
        if (id === "#") return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        var navHeight = 72;
        var top = target.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({
          top: top,
          behavior: "smooth"
        });
      });
    });
  }
  function boot() {
    initEnhancedReveal();
    initTiltCards();
    initMagneticButtons();
    initHeroParallax();
    initParallaxDividers();
    initScrollProgress();
    initSmoothScroll();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();