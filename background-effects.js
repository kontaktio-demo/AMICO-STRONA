"use strict";

(function() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  function initParticleCanvas() {
    var canvas = document.createElement("canvas");
    canvas.id = "bgParticles";
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;";
    document.body.prepend(canvas);
    var ctx = canvas.getContext("2d");
    var w, h, particles;
    var PARTICLE_COUNT = Math.min(Math.floor(window.innerWidth / 25), 50);
    var CONNECT_DIST = 120;
    var SPEED = .15;
    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    function createParticles() {
      particles = [];
      for (var i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - .5) * SPEED,
          vy: (Math.random() - .5) * SPEED,
          r: Math.random() * 1.5 + .5,
          opacity: Math.random() * .15 + .05
        });
      }
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(14,21,51," + p.opacity + ")";
        ctx.fill();
        for (var j = i + 1; j < particles.length; j++) {
          var q = particles[j];
          var dx = p.x - q.x;
          var dy = p.y - q.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = "rgba(14,21,51," + .06 * (1 - dist / CONNECT_DIST) + ")";
            ctx.lineWidth = .5;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    }
    resize();
    createParticles();
    draw();
    var resizeTimer;
    window.addEventListener("resize", function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        resize();
        createParticles();
      }, 250);
    });
  }
  function initFloatingDust() {
    var heroParticles = document.getElementById("heroParticles");
    if (!heroParticles) return;
    for (var i = 0; i < 30; i++) {
      var dot = document.createElement("span");
      dot.className = "hero-dust";
      dot.style.cssText = "position:absolute;" + "width:" + (Math.random() * 3 + 1) + "px;" + "height:" + (Math.random() * 3 + 1) + "px;" + "background:rgba(14,21,51," + (Math.random() * .3 + .05) + ");" + "border-radius:50%;" + "left:" + Math.random() * 100 + "%;" + "top:" + Math.random() * 100 + "%;" + "animation:dustFloat " + (Math.random() * 15 + 10) + "s ease-in-out " + Math.random() * 5 + "s infinite;";
      heroParticles.appendChild(dot);
    }
  }
  function initMaterialSlideshow() {
    var slideshows = document.querySelectorAll(".material-slideshow");
    if (!slideshows.length) return;
    var BASE_INTERVAL_MS = 3e3;
    var STAGGER_OFFSET_MS = 700;
    slideshows.forEach(function(slideshow, index) {
      var slides = slideshow.querySelectorAll(".material-slide");
      if (slides.length < 2) return;
      var current = 0;
      var interval = BASE_INTERVAL_MS + index * STAGGER_OFFSET_MS;
      slideshow._slideshowTimer = setInterval(function() {
        slides[current].classList.remove("active");
        current = (current + 1) % slides.length;
        slides[current].classList.add("active");
      }, interval);
    });
  }
  function initFloatingShapes() {
    var sections = document.querySelectorAll("#oferta, #dlaczego-my, #inspiracje, #realizacje");
    sections.forEach(function(section) {
      var count = 4;
      for (var i = 0; i < count; i++) {
        var shape = document.createElement("div");
        shape.className = "floating-shape";
        shape.setAttribute("aria-hidden", "true");
        var size = Math.random() * 80 + 30;
        var isCircle = Math.random() > .4;
        var isDiamond = !isCircle && Math.random() > .5;
        var borderRadius = isCircle ? "50%" : isDiamond ? "4px" : "0";
        var rotation = isDiamond ? "rotate(45deg)" : "rotate(" + Math.random() * 360 + "deg)";
        var animName = Math.random() > .5 ? "floatShape" : "floatShapeSlow";
        shape.style.cssText = "position:absolute;" + "width:" + size + "px;" + "height:" + size + "px;" + "border:1px solid rgba(14,21,51," + (Math.random() * .1 + .04) + ");" + "border-radius:" + borderRadius + ";" + "left:" + (Math.random() * 90 + 5) + "%;" + "top:" + (Math.random() * 80 + 10) + "%;" + "pointer-events:none;" + "z-index:0;" + "opacity:0.4;" + "animation:" + animName + " " + (Math.random() * 20 + 15) + "s ease-in-out " + Math.random() * 5 + "s infinite;" + "transform:" + rotation + ";";
        section.appendChild(shape);
      }
    });
  }
  var PARALLAX_INTENSITY = 15;
  function initSectionParallax() {
    var elements = document.querySelectorAll(".feature-card, .why-card, .carousel-card, .inspiration-slide");
    if (!elements.length) return;
    function update() {
      var winH = window.innerHeight;
      elements.forEach(function(el) {
        var rect = el.getBoundingClientRect();
        if (rect.top > winH || rect.bottom < 0) return;
        var progress = (winH - rect.top) / (winH + rect.height);
        var shift = (progress - .5) * PARALLAX_INTENSITY;
        el.style.setProperty("--parallax-y", shift + "px");
      });
    }
    window.addEventListener("scroll", function() {
      requestAnimationFrame(update);
    }, {
      passive: true
    });
    update();
  }
  function initSectionBgParallax() {
    var sections = document.querySelectorAll(".section.has-bg");
    if (!sections.length) return;
    function update() {
      var winH = window.innerHeight;
      sections.forEach(function(section) {
        var rect = section.getBoundingClientRect();
        if (rect.top > winH || rect.bottom < 0) return;
        var progress = (winH - rect.top) / (winH + rect.height);
        var shift = (progress - .5) * 30;
        var bg = section.querySelector(":scope::before") || section;
        section.style.setProperty("--bg-shift", shift + "px");
      });
    }
    window.addEventListener("scroll", function() {
      requestAnimationFrame(update);
    }, {
      passive: true
    });
    update();
  }
  function boot() {
    initParticleCanvas();
    initFloatingShapes();
    initSectionParallax();
    initSectionBgParallax();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();