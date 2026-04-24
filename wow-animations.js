"use strict";

(function() {
  var prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduce) return;
  var isDesktop = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var TILT_MAX_DEG = 4;
  var MAGNETIC_STRENGTH = .12;
  var HERO_PARALLAX_FACTOR = .3;
  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }
  function initEnhancedReveal() {
    var selectors = [ ".reveal-left", ".reveal-right", ".reveal-scale", ".reveal-blur", ".reveal-soft", ".section-header" ];
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
  function initParallaxImages() {
    var els = document.querySelectorAll("[data-parallax]");
    if (!els.length) return;
    var winH = window.innerHeight;
    var items = [];
    els.forEach(function(el) {
      var speed = parseFloat(el.getAttribute("data-parallax")) || .15;
      // Clamp speed so mobile never feels juddery.
      if (!isDesktop) speed = Math.min(speed, .12);
      items.push({ el: el, speed: speed, current: 0, target: 0, visible: false });
    });
    var running = false;
    var SMOOTH = isDesktop ? .14 : .22; // higher = snappier; lower = silkier
    function compute() {
      winH = window.innerHeight;
      items.forEach(function(it) {
        var rect = it.el.getBoundingClientRect();
        if (rect.bottom < -120 || rect.top > winH + 120) {
          it.visible = false;
          return;
        }
        it.visible = true;
        var center = rect.top + rect.height / 2;
        it.target = (center - winH / 2) * it.speed * -1;
      });
    }
    function tick() {
      var anyMoving = false;
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var diff = it.target - it.current;
        if (Math.abs(diff) > .1) {
          it.current += diff * SMOOTH;
          it.el.style.transform = "translate3d(0," + it.current.toFixed(2) + "px,0)";
          anyMoving = true;
        } else if (it.current !== it.target) {
          it.current = it.target;
          it.el.style.transform = "translate3d(0," + it.current.toFixed(2) + "px,0)";
        }
      }
      if (anyMoving) {
        window.requestAnimationFrame(tick);
      } else {
        running = false;
      }
    }
    function start() {
      if (running) return;
      running = true;
      window.requestAnimationFrame(tick);
    }
    function onScroll() {
      compute();
      start();
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    compute();
    // Snap to initial target so first frame isn't a big jump.
    items.forEach(function(it) { it.current = it.target; if (it.visible) it.el.style.transform = "translate3d(0," + it.current.toFixed(2) + "px,0)"; });
  }
  function initTileInView() {
    var tiles = document.querySelectorAll(".service-tile");
    if (!tiles.length) return;
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
        }
      });
    }, { threshold: .25 });
    tiles.forEach(function(t) { observer.observe(t); });
  }
  function initImageFadeIn() {
    // Smooth blur-up + fade-in for every <img>: avoids the harsh pop-in once
    // the network/disk delivers the file, on every device.
    var imgs = document.querySelectorAll("img");
    if (!imgs.length) return;
    imgs.forEach(function(img) {
      // Skip tiny inline icons / SVG logos that should appear instantly.
      if (img.hasAttribute("data-no-fade")) return;
      var src = img.getAttribute("src") || "";
      if (/\.svg(\?|$)/i.test(src)) return;
      img.classList.add("img-fade");
      var markLoaded = function() {
        img.classList.add("img-loaded");
      };
      if (img.complete && img.naturalWidth > 0) {
        // Already cached — reveal next frame so the transition still plays
        // gracefully even on hard refresh.
        requestAnimationFrame(markLoaded);
      } else {
        img.addEventListener("load", markLoaded, { once: true });
        img.addEventListener("error", markLoaded, { once: true });
      }
    });
  }
  function initGroupStagger() {
    // Auto-assign --i index to siblings inside common grid containers so the
    // stagger from wow-animations.css ".reveal[style*='--i']" applies.
    var groupSelectors = [
      ".feature-cards", ".why-cards", ".offer-features",
      ".gallery-grid", ".corobimy-grid", ".materials-grid",
      ".carousel-track", ".inspiracje-grid", ".services-grid",
      ".values-grid", ".uslugi-grid"
    ];
    groupSelectors.forEach(function(sel) {
      document.querySelectorAll(sel).forEach(function(group) {
        var i = 0;
        Array.prototype.forEach.call(group.children, function(child) {
          if (child.classList && child.classList.contains("reveal")) {
            // Don't override if author already set --i.
            if (!/--i:/.test(child.getAttribute("style") || "")) {
              child.style.setProperty("--i", i);
            }
            i++;
          }
        });
      });
    });
  }
  function initHeroKenBurns() {
    // Subtle slow zoom on the active hero slide for a cinematic feel.
    var slides = document.querySelectorAll(".hero-slide");
    if (!slides.length) return;
    slides.forEach(function(s) { s.classList.add("ken-burns"); });
  }
  function boot() {
    initEnhancedReveal();
    initTiltCards();
    initMagneticButtons();
    initHeroParallax();
    initParallaxDividers();
    initScrollProgress();
    initSmoothScroll();
    initGroupStagger();
    initParallaxImages();
    initTileInView();
    initImageFadeIn();
    initHeroKenBurns();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();