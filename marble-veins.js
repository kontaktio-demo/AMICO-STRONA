/* ═══════════════════════════════════════════════════════
   MARBLE VEINS — Canvas-based marble vein generator
   Creates unique organic marble vein patterns per page
   via data-marble-theme on <body>
   ═══════════════════════════════════════════════════════ */
'use strict';

(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var theme = document.body.getAttribute('data-marble-theme');
  if (!theme) return;

  /* ── Simple seeded PRNG (Mulberry32) ── */
  function prng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ── 2D value noise ── */
  function createNoise(seed) {
    var rand = prng(seed);
    var SIZE = 256;
    var perm = [];
    var i;
    for (i = 0; i < SIZE; i++) perm[i] = i;
    for (i = SIZE - 1; i > 0; i--) {
      var j = (rand() * (i + 1)) | 0;
      var tmp = perm[i]; perm[i] = perm[j]; perm[j] = tmp;
    }
    for (i = 0; i < SIZE; i++) perm[SIZE + i] = perm[i];

    var gradX = [], gradY = [];
    for (i = 0; i < SIZE; i++) {
      var angle = rand() * Math.PI * 2;
      gradX[i] = Math.cos(angle);
      gradY[i] = Math.sin(angle);
    }

    function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    function lerp(a, b, t) { return a + t * (b - a); }

    return function noise2D(x, y) {
      var xi = Math.floor(x) & 255;
      var yi = Math.floor(y) & 255;
      var xf = x - Math.floor(x);
      var yf = y - Math.floor(y);
      var u = fade(xf);
      var v = fade(yf);

      var aa = perm[perm[xi] + yi];
      var ab = perm[perm[xi] + yi + 1];
      var ba = perm[perm[xi + 1] + yi];
      var bb = perm[perm[xi + 1] + yi + 1];

      var x1 = lerp(
        gradX[aa % 256] * xf + gradY[aa % 256] * yf,
        gradX[ba % 256] * (xf - 1) + gradY[ba % 256] * yf, u);
      var x2 = lerp(
        gradX[ab % 256] * xf + gradY[ab % 256] * (yf - 1),
        gradX[bb % 256] * (xf - 1) + gradY[bb % 256] * (yf - 1), u);
      return lerp(x1, x2, v);
    };
  }

  /* ── fbm (fractal Brownian motion) ── */
  function fbm(noise, x, y, octaves) {
    var val = 0, amp = 1, freq = 1, max = 0;
    for (var i = 0; i < octaves; i++) {
      val += noise(x * freq, y * freq) * amp;
      max += amp;
      amp *= 0.5;
      freq *= 2;
    }
    return val / max;
  }

  /* ── Theme definitions ── */
  var themes = {
    calacatta:       { seed: 42,  color: [220, 185, 120], color2: [200, 165, 100], angle: 35,  veins: 9,  thickness: 2.5, glow: 40 },
    carrara:         { seed: 73,  color: [180, 195, 220], color2: [150, 170, 200], angle: -20, veins: 11, thickness: 2.0, glow: 35 },
    'nero-marquina': { seed: 137, color: [255, 255, 255], color2: [220, 220, 240], angle: 55,  veins: 7,  thickness: 3.0, glow: 45 },
    emperador:       { seed: 211, color: [200, 150, 85],  color2: [175, 125, 70],  angle: -40, veins: 10, thickness: 2.2, glow: 38 },
    levanto:         { seed: 307, color: [210, 105, 80],  color2: [160, 75, 60],   angle: 25,  veins: 8,  thickness: 2.5, glow: 40 },
    portoro:         { seed: 401, color: [240, 210, 95],  color2: [210, 180, 65],  angle: -55, veins: 7,  thickness: 2.8, glow: 42 },
    guatemala:       { seed: 509, color: [90, 175, 120],  color2: [60, 140, 95],   angle: 30,  veins: 9,  thickness: 2.2, glow: 36 },
    sodalite:        { seed: 613, color: [95, 125, 210],  color2: [65, 100, 175],  angle: -30, veins: 8,  thickness: 2.4, glow: 38 },
    'silver-wave':   { seed: 719, color: [210, 215, 230], color2: [180, 185, 200], angle: 45,  veins: 10, thickness: 1.8, glow: 32 },
    statuario:       { seed: 827, color: [200, 200, 220], color2: [165, 165, 185], angle: -50, veins: 8,  thickness: 2.8, glow: 42 },
    arabescato:      { seed: 937, color: [195, 185, 210], color2: [165, 155, 180], angle: 20,  veins: 12, thickness: 1.6, glow: 30 }
  };

  var cfg = themes[theme];
  if (!cfg) return;

  /* ── Draw marble veins on a canvas ── */
  function drawMarble(canvas, sectionIndex) {
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;
    var seed = cfg.seed + sectionIndex * 97;
    var noise = createNoise(seed);
    var noise2 = createNoise(seed + 500);
    var rand = prng(seed + 1000);
    var angleRad = (cfg.angle + sectionIndex * 15) * Math.PI / 180;
    var cosA = Math.cos(angleRad);
    var sinA = Math.sin(angleRad);

    ctx.clearRect(0, 0, w, h);

    /* ── Draw individual veins ── */
    var numVeins = cfg.veins + Math.floor(rand() * 3);

    for (var v = 0; v < numVeins; v++) {
      var veinSeed = seed + v * 31;
      var veinNoise = createNoise(veinSeed);
      var r = rand();

      /* Starting position - distributed across the canvas */
      var startFrac = (v + rand() * 0.6) / numVeins;
      var perpOffset = startFrac * Math.max(w, h) * 1.2 - Math.max(w, h) * 0.1;

      /* Vein properties */
      var baseThickness = cfg.thickness * (0.5 + rand() * 1.5);
      var isPrimary = v < 3;
      var opacity = isPrimary ? (0.30 + rand() * 0.15) : (0.12 + rand() * 0.10);
      var color = rand() > 0.4 ? cfg.color : cfg.color2;
      var glowSize = cfg.glow * (isPrimary ? 1.2 : 0.6);
      var waveFreq = 0.0008 + rand() * 0.002;
      var waveAmp = 30 + rand() * 80;
      var noiseScale = 0.003 + rand() * 0.004;

      /* Draw the vein as a path following noise-perturbed sine wave */
      var steps = Math.max(w, h) * 1.5;
      var stepSize = 1.5;

      /* Glow layer */
      ctx.save();
      ctx.globalAlpha = opacity * 0.6;
      ctx.strokeStyle = 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',1)';
      ctx.lineWidth = baseThickness + glowSize;
      ctx.filter = 'blur(' + Math.round(glowSize * 0.6) + 'px)';
      ctx.beginPath();

      for (var s = 0; s <= steps; s += stepSize * 3) {
        var t = s / steps;
        var along = s - steps * 0.25;
        var noiseVal = fbm(veinNoise, t * 4, sectionIndex * 3.7, 3);
        var noiseVal2 = fbm(noise2, t * 6 + v * 2, sectionIndex * 2.3 + 1, 2);
        var wave = Math.sin(along * waveFreq + v * 1.7) * waveAmp;
        var perp = perpOffset + wave + noiseVal * 120 + noiseVal2 * 60;

        var px = along * cosA - perp * sinA + w * 0.5;
        var py = along * sinA + perp * cosA + h * 0.5;

        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();

      /* Main vein line */
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',1)';
      ctx.lineWidth = baseThickness;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();

      for (s = 0; s <= steps; s += stepSize) {
        t = s / steps;
        along = s - steps * 0.25;
        noiseVal = fbm(veinNoise, t * 4, sectionIndex * 3.7, 3);
        noiseVal2 = fbm(noise2, t * 6 + v * 2, sectionIndex * 2.3 + 1, 2);
        wave = Math.sin(along * waveFreq + v * 1.7) * waveAmp;
        perp = perpOffset + wave + noiseVal * 120 + noiseVal2 * 60;

        px = along * cosA - perp * sinA + w * 0.5;
        py = along * sinA + perp * cosA + h * 0.5;

        /* Vary thickness along the vein */
        var thickVar = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * Math.PI * 2 * (2 + rand())));
        ctx.lineWidth = baseThickness * thickVar;

        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();

      /* Sub-veins branching off primary veins */
      if (isPrimary && rand() > 0.2) {
        var numBranches = 3 + Math.floor(rand() * 4);
        for (var b = 0; b < numBranches; b++) {
          var branchT = 0.15 + rand() * 0.7;
          var branchAlong = branchT * steps - steps * 0.25;
          var branchNoiseVal = fbm(veinNoise, branchT * 4, sectionIndex * 3.7, 3);
          var branchWave = Math.sin(branchAlong * waveFreq + v * 1.7) * waveAmp;
          var branchPerp = perpOffset + branchWave + branchNoiseVal * 120;

          var bx = branchAlong * cosA - branchPerp * sinA + w * 0.5;
          var by = branchAlong * sinA + branchPerp * cosA + h * 0.5;

          var branchAngle = angleRad + (rand() - 0.5) * 1.4;
          var branchLen = 80 + rand() * 200;
          var branchNoise = createNoise(veinSeed + b * 13);

          ctx.save();
          ctx.globalAlpha = opacity * 0.7;
          ctx.strokeStyle = 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',1)';
          ctx.lineWidth = baseThickness * 0.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(bx, by);

          for (var bs = 0; bs < branchLen; bs += 2) {
            var bt = bs / branchLen;
            var bnoise = fbm(branchNoise, bt * 5, b * 3, 2) * 30;
            bx += Math.cos(branchAngle) * 2 + bnoise * 0.1;
            by += Math.sin(branchAngle) * 2 + bnoise * 0.1;
            ctx.lineTo(bx, by);
            ctx.globalAlpha = opacity * 0.7 * (1 - bt * 0.8);
          }
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    /* ── Soft radial ambient patches for depth ── */
    for (var p = 0; p < 5; p++) {
      var px2 = rand() * w;
      var py2 = rand() * h;
      var radius = Math.min(w, h) * (0.25 + rand() * 0.4);
      var grad = ctx.createRadialGradient(px2, py2, 0, px2, py2, radius);
      var ac = rand() > 0.5 ? cfg.color : cfg.color2;
      grad.addColorStop(0, 'rgba(' + ac[0] + ',' + ac[1] + ',' + ac[2] + ',0.06)');
      grad.addColorStop(0.5, 'rgba(' + ac[0] + ',' + ac[1] + ',' + ac[2] + ',0.025)');
      grad.addColorStop(1, 'rgba(' + ac[0] + ',' + ac[1] + ',' + ac[2] + ',0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }
  }

  /* ── Inject marble canvases into sections ── */
  function injectMarble() {
    var sections = document.querySelectorAll('.section:not(.has-bg):not(.agd-brands-section)');

    sections.forEach(function (section, idx) {
      var rect = section.getBoundingClientRect();
      var w = Math.max(rect.width, 800);
      var h = Math.max(rect.height, 400);

      /* Use lower resolution for performance, scale up via CSS */
      var scale = Math.min(1, 1600 / w);
      var cw = Math.round(w * scale);
      var ch = Math.round(h * scale);

      var canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;
      canvas.className = 'marble-vein-canvas';
      canvas.setAttribute('aria-hidden', 'true');

      drawMarble(canvas, idx);

      var wrapper = document.createElement('div');
      wrapper.className = 'marble-vein-layer';
      wrapper.setAttribute('aria-hidden', 'true');
      wrapper.appendChild(canvas);

      section.insertBefore(wrapper, section.firstChild);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectMarble);
  } else {
    injectMarble();
  }
})();

