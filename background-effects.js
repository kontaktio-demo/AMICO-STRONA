'use strict';

(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function initParticleCanvas() {
    var canvas = document.createElement('canvas');
    canvas.id = 'bgParticles';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;';
    document.body.prepend(canvas);

    var ctx = canvas.getContext('2d');
    var w, h, particles;
    var PARTICLE_COUNT = Math.min(Math.floor(window.innerWidth / 25), 50);
    var CONNECT_DIST = 120;
    var SPEED = 0.15;

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
          vx: (Math.random() - 0.5) * SPEED,
          vy: (Math.random() - 0.5) * SPEED,
          r: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.15 + 0.05,
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
        ctx.fillStyle = 'rgba(30,58,95,' + p.opacity + ')';
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
            ctx.strokeStyle = 'rgba(30,58,95,' + (0.06 * (1 - dist / CONNECT_DIST)) + ')';
            ctx.lineWidth = 0.5;
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
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        resize();
        createParticles();
      }, 250);
    });
  }

  function initFloatingDust() {
    var heroParticles = document.getElementById('heroParticles');
    if (!heroParticles) return;

    for (var i = 0; i < 30; i++) {
      var dot = document.createElement('span');
      dot.className = 'hero-dust';
      dot.style.cssText =
        'position:absolute;' +
        'width:' + (Math.random() * 3 + 1) + 'px;' +
        'height:' + (Math.random() * 3 + 1) + 'px;' +
        'background:rgba(30,58,95,' + (Math.random() * 0.3 + 0.05) + ');' +
        'border-radius:50%;' +
        'left:' + (Math.random() * 100) + '%;' +
        'top:' + (Math.random() * 100) + '%;' +
        'animation:dustFloat ' + (Math.random() * 15 + 10) + 's ease-in-out ' + (Math.random() * 5) + 's infinite;';
      heroParticles.appendChild(dot);
    }
  }

  function boot() {
    initParticleCanvas();
    initFloatingDust();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
