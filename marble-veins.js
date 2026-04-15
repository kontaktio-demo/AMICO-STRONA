/* ═══════════════════════════════════════════════════════════════════════════
   MARBLE VEINS v3 — Premium continuous flowing marble vein generator
   Creates photo-realistic marble vein patterns using pure Bézier curves —
   no dots, no nodes, only smooth organic flowing lines that mimic real
   marble veining (calacatta, carrara, nero marquina, etc.).
   Activated via data-marble-theme on <body>.
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var theme = document.body.getAttribute('data-marble-theme');
  if (!theme) return;

  /* ═══════════════ PRNG ═══════════════ */
  function prng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ═══════════════ PERLIN NOISE ═══════════════ */
  function createNoise(seed) {
    var r = prng(seed);
    var S = 256, perm = [], gx = [], gy = [], i;
    for (i = 0; i < S; i++) perm[i] = i;
    for (i = S - 1; i > 0; i--) {
      var j = (r() * (i + 1)) | 0;
      var tmp = perm[i]; perm[i] = perm[j]; perm[j] = tmp;
    }
    for (i = 0; i < S; i++) perm[S + i] = perm[i];
    for (i = 0; i < S; i++) {
      var a = r() * Math.PI * 2;
      gx[i] = Math.cos(a); gy[i] = Math.sin(a);
    }
    function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    function lerp(a, b, t) { return a + t * (b - a); }
    return function (x, y) {
      var xi = Math.floor(x) & 255, yi = Math.floor(y) & 255;
      var xf = x - Math.floor(x), yf = y - Math.floor(y);
      var u = fade(xf), v = fade(yf);
      var aa = perm[perm[xi] + yi], ab = perm[perm[xi] + yi + 1];
      var ba = perm[perm[xi + 1] + yi], bb = perm[perm[xi + 1] + yi + 1];
      return lerp(
        lerp(gx[aa & 255] * xf + gy[aa & 255] * yf,
             gx[ba & 255] * (xf - 1) + gy[ba & 255] * yf, u),
        lerp(gx[ab & 255] * xf + gy[ab & 255] * (yf - 1),
             gx[bb & 255] * (xf - 1) + gy[bb & 255] * (yf - 1), u), v);
    };
  }

  function fbm(noise, x, y, oct, lac, gain) {
    lac = lac || 2.0; gain = gain || 0.5;
    var val = 0, amp = 1, freq = 1, mx = 0;
    for (var i = 0; i < oct; i++) {
      val += noise(x * freq, y * freq) * amp;
      mx += amp; amp *= gain; freq *= lac;
    }
    return val / mx;
  }

  function domainWarp(noise, x, y, oct, str) {
    var q0 = fbm(noise, x, y, oct);
    var q1 = fbm(noise, x + 5.2, y + 1.3, oct);
    return fbm(noise, x + str * q0, y + str * q1, oct);
  }

  function doubleWarp(noise, noise2, x, y, oct, str) {
    var w1 = domainWarp(noise, x, y, oct, str);
    var w2 = domainWarp(noise2, x + 1.7, y + 3.2, oct, str * 0.7);
    return w1 * 0.65 + w2 * 0.35;
  }

  /* ═══════════════ THEME DEFINITIONS ═══════════════ */
  var themes = {
    calacatta: {
      seed: 42,
      colors: [[220,185,120],[200,165,100],[235,210,155],[245,225,170],[190,160,110]],
      ambient: [230,200,140],
      angle: 32, primaryN: 5, secondaryN: 12, microN: 0.7,
      pThick: [2.8,7.0], sThick: [0.8,2.8],
      pAlpha: [0.22,0.42], sAlpha: [0.07,0.20],
      glow: 0.60, warp: 3.8, branchP: 0.78, branchN: [4,10],
      microA: [0.025,0.09], patches: 10
    },
    carrara: {
      seed: 73,
      colors: [[180,195,220],[150,170,200],[200,215,240],[215,228,248],[160,175,195]],
      ambient: [190,205,230],
      angle: -18, primaryN: 6, secondaryN: 14, microN: 0.85,
      pThick: [2.0,5.5], sThick: [0.5,2.0],
      pAlpha: [0.18,0.34], sAlpha: [0.06,0.16],
      glow: 0.48, warp: 3.2, branchP: 0.72, branchN: [4,9],
      microA: [0.02,0.07], patches: 11
    },
    'nero-marquina': {
      seed: 137,
      colors: [[255,255,255],[220,220,240],[240,240,255],[250,248,255],[200,200,220]],
      ambient: [230,230,245],
      angle: 50, primaryN: 4, secondaryN: 9, microN: 0.55,
      pThick: [3.2,8.0], sThick: [1.0,3.2],
      pAlpha: [0.26,0.48], sAlpha: [0.10,0.24],
      glow: 0.65, warp: 4.2, branchP: 0.65, branchN: [3,7],
      microA: [0.035,0.12], patches: 7
    },
    emperador: {
      seed: 211,
      colors: [[200,150,85],[175,125,70],[220,175,110],[235,195,130],[180,140,90]],
      ambient: [210,165,100],
      angle: -38, primaryN: 6, secondaryN: 13, microN: 0.75,
      pThick: [2.4,5.8], sThick: [0.7,2.2],
      pAlpha: [0.22,0.38], sAlpha: [0.08,0.19],
      glow: 0.52, warp: 3.4, branchP: 0.75, branchN: [4,9],
      microA: [0.025,0.08], patches: 9
    },
    levanto: {
      seed: 307,
      colors: [[210,105,80],[160,75,60],[230,135,105],[245,155,125],[180,95,75]],
      ambient: [200,120,95],
      angle: 22, primaryN: 5, secondaryN: 10, microN: 0.60,
      pThick: [2.6,6.2], sThick: [0.8,2.4],
      pAlpha: [0.23,0.40], sAlpha: [0.08,0.21],
      glow: 0.55, warp: 3.6, branchP: 0.70, branchN: [3,8],
      microA: [0.03,0.09], patches: 8
    },
    portoro: {
      seed: 401,
      colors: [[240,210,95],[210,180,65],[255,230,130],[250,235,150],[200,175,80]],
      ambient: [230,205,100],
      angle: -52, primaryN: 4, secondaryN: 9, microN: 0.50,
      pThick: [3.0,7.0], sThick: [1.0,2.8],
      pAlpha: [0.25,0.44], sAlpha: [0.10,0.23],
      glow: 0.60, warp: 4.0, branchP: 0.65, branchN: [3,7],
      microA: [0.035,0.11], patches: 7
    },
    guatemala: {
      seed: 509,
      colors: [[90,175,120],[60,140,95],[120,200,150],[140,215,165],[75,155,105]],
      ambient: [100,185,130],
      angle: 28, primaryN: 5, secondaryN: 11, microN: 0.70,
      pThick: [2.2,5.4], sThick: [0.7,2.0],
      pAlpha: [0.20,0.36], sAlpha: [0.07,0.18],
      glow: 0.50, warp: 3.4, branchP: 0.72, branchN: [4,9],
      microA: [0.025,0.08], patches: 8
    },
    sodalite: {
      seed: 613,
      colors: [[95,125,210],[65,100,175],[125,155,235],[145,170,248],[80,110,190]],
      ambient: [105,140,220],
      angle: -28, primaryN: 5, secondaryN: 10, microN: 0.65,
      pThick: [2.5,5.8], sThick: [0.8,2.4],
      pAlpha: [0.22,0.38], sAlpha: [0.08,0.19],
      glow: 0.52, warp: 3.6, branchP: 0.70, branchN: [3,8],
      microA: [0.03,0.09], patches: 8
    },
    'silver-wave': {
      seed: 719,
      colors: [[210,215,230],[180,185,200],[230,235,248],[240,242,252],[195,200,215]],
      ambient: [220,225,240],
      angle: 42, primaryN: 6, secondaryN: 14, microN: 0.90,
      pThick: [1.8,4.5], sThick: [0.5,1.6],
      pAlpha: [0.16,0.32], sAlpha: [0.06,0.15],
      glow: 0.42, warp: 3.0, branchP: 0.75, branchN: [5,11],
      microA: [0.018,0.07], patches: 11
    },
    statuario: {
      seed: 827,
      colors: [[200,200,220],[165,165,185],[225,225,245],[240,240,255],[185,185,205]],
      ambient: [210,210,230],
      angle: -48, primaryN: 5, secondaryN: 10, microN: 0.60,
      pThick: [2.8,6.5], sThick: [0.9,2.6],
      pAlpha: [0.24,0.42], sAlpha: [0.09,0.21],
      glow: 0.57, warp: 3.8, branchP: 0.68, branchN: [3,8],
      microA: [0.035,0.10], patches: 8
    },
    arabescato: {
      seed: 937,
      colors: [[195,185,210],[165,155,180],[220,210,235],[235,225,248],[180,170,195]],
      ambient: [205,195,220],
      angle: 18, primaryN: 7, secondaryN: 16, microN: 0.95,
      pThick: [1.6,4.2], sThick: [0.4,1.5],
      pAlpha: [0.14,0.30], sAlpha: [0.05,0.14],
      glow: 0.40, warp: 2.8, branchP: 0.80, branchN: [5,12],
      microA: [0.015,0.06], patches: 12
    }
  };

  var cfg = themes[theme];
  if (!cfg) return;

  /* ═══════════════ HELPERS ═══════════════ */
  var _rand = prng(cfg.seed);
  function rr(a, b) { return a + (b - a) * _rand(); }
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function pickC() { return cfg.colors[(_rand() * cfg.colors.length) | 0]; }

  /* ═══════════════ GLOBAL VEIN PATH GENERATION ═══════════════ */
  /*
   * Generate flowing vein paths as smooth point arrays.
   * Each point has x, y, thickness factor (th), and alpha factor.
   * Uses multi-layered noise + domain warping for organic marble folds.
   */
  function genVein(noise, noise2, idx, pw, ph, primary) {
    var aRad = (cfg.angle + idx * (primary ? 7 : 13) + (_rand() - 0.5) * 12) * Math.PI / 180;
    var cosA = Math.cos(aRad), sinA = Math.sin(aRad);
    var vn = createNoise(cfg.seed + idx * 31 + 700);
    var vn2 = createNoise(cfg.seed + idx * 47 + 1100);

    var total = cfg.primaryN + cfg.secondaryN;
    var frac = (idx + _rand() * 0.5) / total;
    var diag = Math.sqrt(pw * pw + ph * ph);
    var perpOff = frac * diag * 1.15 - diag * 0.075;

    var wFreq = 0.0002 + _rand() * 0.0008;
    var wAmp = primary ? (60 + _rand() * 140) : (25 + _rand() * 80);
    var warpAmt = cfg.warp * (primary ? 1.0 : 0.6);

    var pts = [];
    var len = diag * 1.7;
    /* Finer step = smoother curves, no jagged segments */
    var step = primary ? 1.8 : 3;

    for (var s = 0; s <= len; s += step) {
      var t = s / len;
      var along = s - len * 0.35;

      /* Multi-layer noise + double domain warp for organic marble folds */
      var n1 = fbm(vn, t * 3.2, idx * 2.5, 5, 2.1, 0.48);
      var n2 = fbm(vn2, t * 4.5 + idx * 1.3, idx * 3.0 + 0.7, 4, 2.3, 0.45);
      var warp = doubleWarp(noise, noise2, t * 2.2 + idx * 0.6, idx * 1.1, 4, warpAmt);
      var wave = Math.sin(along * wFreq + idx * 1.1) * wAmp;
      var wave2 = Math.sin(along * wFreq * 2.7 + idx * 0.8 + 1.5) * wAmp * 0.3;

      var perp = perpOff + wave + wave2 + n1 * 160 + n2 * 80 + warp * 120;
      var px = along * cosA - perp * sinA + pw * 0.5;
      var py = along * sinA + perp * cosA + ph * 0.5;

      /* Smooth organic thickness variation using layered sine waves */
      var tv = 0.15 + 0.85 * Math.pow(
        0.5 + 0.5 * Math.sin(t * Math.PI * (1.3 + _rand() * 2.5) + idx * 0.9), 1.6
      );
      /* Additional subtle thickness noise */
      var tnoise = fbm(vn, t * 8, idx * 5.3, 3) * 0.3;
      tv = Math.max(0.08, tv + tnoise);

      /* Gentle taper at endpoints */
      var tap = 1;
      if (t < 0.05) tap = Math.pow(t / 0.05, 0.7);
      else if (t > 0.95) tap = Math.pow((1 - t) / 0.05, 0.7);
      tv *= tap;

      pts.push({ x: px, y: py, t: t, th: tv });
    }
    return pts;
  }

  /* Generate branch veins that fork off from main veins */
  function genBranches(mainPts, idx) {
    if (_rand() > cfg.branchP) return [];
    var brs = [];
    var nb = cfg.branchN[0] + Math.floor(_rand() * (cfg.branchN[1] - cfg.branchN[0]));

    for (var b = 0; b < nb; b++) {
      var bi = Math.floor((0.08 + _rand() * 0.78) * mainPts.length);
      var o = mainPts[Math.min(bi, mainPts.length - 1)];
      var ba = (cfg.angle + idx * 7) * Math.PI / 180 + (_rand() - 0.5) * 2.0;
      var bl = 50 + _rand() * 350;
      var bn = createNoise(cfg.seed + idx * 31 + b * 17 + 3000);
      var bn2 = createNoise(cfg.seed + idx * 31 + b * 23 + 3500);

      var pts = [];
      var bx = o.x, by = o.y;
      for (var s = 0; s < bl; s += 1.5) {
        var bt = s / bl;
        var noise1 = fbm(bn, bt * 4, b * 2.1, 3) * 45;
        var noise2val = fbm(bn2, bt * 3, b * 1.7, 2) * 25;
        bx += Math.cos(ba + (noise1 + noise2val) * 0.005) * 1.5;
        by += Math.sin(ba + (noise1 + noise2val) * 0.005) * 1.5;
        /* Smooth tapering: swells slightly then tapers to nothing */
        var tap = Math.pow(1 - bt, 1.5) * Math.min(1, bt * 6) * (0.8 + 0.2 * Math.sin(bt * Math.PI));
        pts.push({ x: bx, y: by, t: bt, th: tap });
      }

      /* Sub-branches for extra realism */
      if (_rand() > 0.4 && pts.length > 25) {
        var sbi = Math.floor((0.2 + _rand() * 0.5) * pts.length);
        var sbo = pts[Math.min(sbi, pts.length - 1)];
        var sba = ba + (_rand() - 0.5) * 1.8;
        var sbl = 25 + _rand() * 100;
        var sbn = createNoise(cfg.seed + idx * 31 + b * 41 + 4000);
        var sub = [];
        var sbx = sbo.x, sby = sbo.y;
        for (var ss = 0; ss < sbl; ss += 1.5) {
          var st = ss / sbl;
          var sn = fbm(sbn, st * 5, b * 3, 2) * 22;
          sbx += Math.cos(sba + sn * 0.007) * 1.5;
          sby += Math.sin(sba + sn * 0.007) * 1.5;
          sub.push({
            x: sbx, y: sby, t: st,
            th: Math.pow(1 - st, 2.0) * Math.min(1, st * 8) * 0.7
          });
        }
        brs.push(sub);
      }

      brs.push(pts);
    }
    return brs;
  }

  /* ═══════════════ MICRO-VEIN NETWORK ═══════════════ */
  function genMicro(noise, pw, ph) {
    var paths = [];
    var cnt = Math.floor(25 * cfg.microN + _rand() * 15);
    for (var m = 0; m < cnt; m++) {
      var sx = _rand() * pw, sy = _rand() * ph;
      var a = (cfg.angle + _rand() * 70 - 35) * Math.PI / 180;
      var l = 25 + _rand() * 180;
      var mn = createNoise(cfg.seed + m * 41 + 5000);
      var pts = [];
      for (var s = 0; s <= l; s += 1.2) {
        var t = s / l;
        var n = fbm(mn, t * 7, m * 1.5, 3) * 20;
        pts.push({
          x: sx + Math.cos(a + n * 0.010) * s,
          y: sy + Math.sin(a + n * 0.010) * s,
          t: t,
          th: Math.sin(t * Math.PI) * (0.3 + _rand() * 0.7) * Math.pow(Math.sin(t * Math.PI), 0.3)
        });
      }
      paths.push(pts);
    }
    return paths;
  }

  /* ═══════════════ SMOOTH BÉZIER CURVE RENDERING ═══════════════ */
  /*
   * Draws a vein path as a smooth quadratic Bézier curve.
   * No individual dots or segments visible — pure flowing line.
   */
  function drawSmoothVein(ctx, pts, baseW, color, alpha, glowR, ox, oy) {
    if (pts.length < 3) return;

    /* Build smoothed point arrays for rendering */
    var sx = [], sy = [], sw = [], sa = [];
    for (var i = 0; i < pts.length; i++) {
      sx.push(pts[i].x - ox);
      sy.push(pts[i].y - oy);
      sw.push(baseW * pts[i].th);
      sa.push(alpha * (0.5 + 0.5 * pts[i].th));
    }

    /* ── Layer 1: Deep diffuse glow (subsurface light in stone) ── */
    if (glowR > 8) {
      ctx.save();
      ctx.globalAlpha = alpha * 0.08 * cfg.glow;
      ctx.strokeStyle = rgba(color, 1);
      ctx.lineWidth = baseW * 0.7 + glowR * 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.filter = 'blur(' + Math.round(glowR * 2) + 'px)';
      ctx.beginPath();
      ctx.moveTo(sx[0], sy[0]);
      for (var g1 = 1; g1 < sx.length; g1 += 8) {
        var g1n = Math.min(g1 + 4, sx.length - 1);
        ctx.quadraticCurveTo(sx[g1], sy[g1], (sx[g1] + sx[g1n]) * 0.5, (sy[g1] + sy[g1n]) * 0.5);
      }
      ctx.stroke();
      ctx.restore();
    }

    /* ── Layer 2: Medium glow halo ── */
    if (glowR > 0) {
      ctx.save();
      ctx.globalAlpha = alpha * 0.20 * cfg.glow;
      ctx.strokeStyle = rgba(color, 1);
      ctx.lineWidth = baseW * 0.5 + glowR * 1.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.filter = 'blur(' + Math.round(glowR * 0.6) + 'px)';
      ctx.beginPath();
      ctx.moveTo(sx[0], sy[0]);
      for (var g2 = 1; g2 < sx.length; g2 += 4) {
        var g2n = Math.min(g2 + 2, sx.length - 1);
        ctx.quadraticCurveTo(sx[g2], sy[g2], (sx[g2] + sx[g2n]) * 0.5, (sy[g2] + sy[g2n]) * 0.5);
      }
      ctx.stroke();
      ctx.restore();
    }

    /* ── Layer 3: Core vein — variable-width Bézier stroke ── */
    /* Render the core vein in overlapping Bézier segments for smooth width transitions */
    ctx.save();
    ctx.strokeStyle = rgba(color, 1);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    /* Draw in groups of points, blending width smoothly */
    var segLen = 6;
    for (var seg = 0; seg < sx.length - 1; seg += Math.max(1, Math.floor(segLen / 2))) {
      var segEnd = Math.min(seg + segLen, sx.length - 1);
      if (segEnd <= seg) break;

      /* Average width and alpha for this segment */
      var avgW = 0, avgA = 0, cnt = 0;
      for (var si = seg; si <= segEnd; si++) {
        avgW += sw[si];
        avgA += sa[si];
        cnt++;
      }
      avgW /= cnt;
      avgA /= cnt;

      if (avgW < 0.12) continue;

      ctx.globalAlpha = avgA;
      ctx.lineWidth = avgW;
      ctx.beginPath();
      ctx.moveTo(sx[seg], sy[seg]);

      for (var k = seg + 1; k <= segEnd; k++) {
        if (k < segEnd) {
          var cpx = sx[k];
          var cpy = sy[k];
          var epx = (sx[k] + sx[k + 1]) * 0.5;
          var epy = (sy[k] + sy[k + 1]) * 0.5;
          ctx.quadraticCurveTo(cpx, cpy, epx, epy);
        } else {
          ctx.lineTo(sx[k], sy[k]);
        }
      }
      ctx.stroke();
    }
    ctx.restore();

    /* ── Layer 4: Bright center highlight on thick veins ── */
    if (baseW > 2.5) {
      var hlColor = [
        Math.min(255, color[0] + 50),
        Math.min(255, color[1] + 50),
        Math.min(255, color[2] + 50)
      ];
      ctx.save();
      ctx.strokeStyle = rgba(hlColor, 1);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (var hl = 0; hl < sx.length - 2; hl += Math.max(1, Math.floor(segLen / 2))) {
        var hlEnd = Math.min(hl + segLen, sx.length - 1);
        var hlW = 0, hlA = 0, hlCnt = 0;
        for (var hi = hl; hi <= hlEnd; hi++) {
          hlW += sw[hi]; hlA += sa[hi]; hlCnt++;
        }
        hlW /= hlCnt; hlA /= hlCnt;

        var coreW = hlW * 0.25;
        if (coreW < 0.25) continue;

        ctx.globalAlpha = hlA * 0.30;
        ctx.lineWidth = coreW;
        ctx.beginPath();
        ctx.moveTo(sx[hl], sy[hl]);
        for (var hk = hl + 1; hk <= hlEnd; hk++) {
          if (hk < hlEnd) {
            ctx.quadraticCurveTo(sx[hk], sy[hk], (sx[hk] + sx[hk + 1]) * 0.5, (sy[hk] + sy[hk + 1]) * 0.5);
          } else {
            ctx.lineTo(sx[hk], sy[hk]);
          }
        }
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  /* ═══════════════ AMBIENT ATMOSPHERE ═══════════════ */
  function drawAmbient(ctx, w, h, elTop, pageH) {
    var an = createNoise(cfg.seed + 9999);

    /* Large ambient color patches — simulate depth and color variation */
    for (var p = 0; p < cfg.patches; p++) {
      var px = _rand() * w, py = _rand() * h;
      var rad = Math.min(w, h) * (0.20 + _rand() * 0.55);
      var c = _rand() > 0.4 ? cfg.ambient : pickC();
      var nv = (fbm(an, (px + elTop) * 0.0008, (py + elTop) * 0.0008, 4) + 1) * 0.5;
      var op = 0.020 + nv * 0.035;

      var gr = ctx.createRadialGradient(px, py, 0, px, py, rad);
      gr.addColorStop(0, rgba(c, op * 1.3));
      gr.addColorStop(0.20, rgba(c, op));
      gr.addColorStop(0.50, rgba(c, op * 0.5));
      gr.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, w, h);
    }

    /* Full-surface polished stone wash */
    for (var t = 0; t < 5; t++) {
      var tx = _rand() * w * 0.6 + w * 0.2;
      var ty = _rand() * h * 0.6 + h * 0.2;
      var tr = Math.max(w, h) * (0.4 + _rand() * 0.6);
      var tc = pickC();
      var tg = ctx.createRadialGradient(tx, ty, 0, tx, ty, tr);
      tg.addColorStop(0, rgba(tc, 0.012));
      tg.addColorStop(0.5, rgba(tc, 0.005));
      tg.addColorStop(1, rgba(tc, 0));
      ctx.fillStyle = tg;
      ctx.fillRect(0, 0, w, h);
    }

    /* Subtle directional gradient to simulate light hitting polished stone */
    var lgAngle = cfg.angle * Math.PI / 180;
    var lx1 = w * 0.5 - Math.cos(lgAngle) * w * 0.5;
    var ly1 = h * 0.5 - Math.sin(lgAngle) * h * 0.5;
    var lx2 = w * 0.5 + Math.cos(lgAngle) * w * 0.5;
    var ly2 = h * 0.5 + Math.sin(lgAngle) * h * 0.5;
    var lg = ctx.createLinearGradient(lx1, ly1, lx2, ly2);
    var lc = cfg.ambient;
    lg.addColorStop(0, rgba(lc, 0.006));
    lg.addColorStop(0.3, rgba(lc, 0.012));
    lg.addColorStop(0.7, rgba(lc, 0.004));
    lg.addColorStop(1, rgba(lc, 0.008));
    ctx.fillStyle = lg;
    ctx.fillRect(0, 0, w, h);
  }

  /* ═══════════════ EDGE FADES ═══════════════ */
  function drawFades(ctx, w, h, fTop, fBot) {
    if (fTop > 0) {
      var gt = ctx.createLinearGradient(0, 0, 0, fTop);
      gt.addColorStop(0, 'rgba(0,0,0,1)');
      gt.addColorStop(0.4, 'rgba(0,0,0,0.5)');
      gt.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = gt;
      ctx.fillRect(0, 0, w, fTop);
      ctx.restore();
    }
    if (fBot > 0) {
      var gb = ctx.createLinearGradient(0, h - fBot, 0, h);
      gb.addColorStop(0, 'rgba(0,0,0,0)');
      gb.addColorStop(0.6, 'rgba(0,0,0,0.5)');
      gb.addColorStop(1, 'rgba(0,0,0,1)');
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = gb;
      ctx.fillRect(0, h - fBot, w, fBot);
      ctx.restore();
    }
  }

  /* ═══════════════ INIT — FULL-PAGE SLAB ═══════════════ */
  function initMarble() {
    var pw = document.documentElement.scrollWidth || document.body.scrollWidth;
    var ph = document.documentElement.scrollHeight || document.body.scrollHeight;
    var noise = createNoise(cfg.seed);
    var noise2 = createNoise(cfg.seed + 500);

    /* ── Generate global vein paths ── */
    var pPaths = [], sPaths = [], branches = [], i;

    for (i = 0; i < cfg.primaryN; i++) {
      var pp = genVein(noise, noise2, i, pw, ph, true);
      pPaths.push(pp);
      branches = branches.concat(genBranches(pp, i));
    }
    for (i = 0; i < cfg.secondaryN; i++) {
      sPaths.push(genVein(noise, noise2, cfg.primaryN + i, pw, ph, false));
    }
    var micros = genMicro(noise, pw, ph);

    /* ── Find dark zones to render into ── */
    var zones = [];
    var scrollT = window.pageYOffset || document.documentElement.scrollTop;

    /* bg-alt sections (no background image) */
    document.querySelectorAll('.section.bg-alt:not(.has-bg):not(.agd-brands-section)').forEach(function (el) {
      zones.push({ el: el, type: 'section' });
    });

    /* Plain sections without bg-alt that don't have has-bg */
    document.querySelectorAll('.section:not(.has-bg):not(.bg-alt):not(.agd-brands-section)').forEach(function (el) {
      zones.push({ el: el, type: 'section' });
    });

    /* Footer kept plain black — no marble veins */

    /* Sort by vertical position */
    zones.sort(function (a, b) {
      return a.el.getBoundingClientRect().top - b.el.getBoundingClientRect().top;
    });

    /* ── Render each zone ── */
    zones.forEach(function (zone, zi) {
      var el = zone.el;
      var rect = el.getBoundingClientRect();
      var elTop = rect.top + scrollT;
      var w = Math.max(rect.width, 320);
      var h = Math.max(rect.height, 60);

      /* Canvas resolution */
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var maxW = 2560;
      var scale = Math.min(dpr, maxW / w);
      var cw = Math.round(w * scale);
      var ch = Math.round(h * scale);

      var canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;
      canvas.className = 'marble-vein-canvas';
      canvas.setAttribute('aria-hidden', 'true');

      var ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);

      /* 1. Ambient background patches */
      drawAmbient(ctx, w, h, elTop, ph);

      /* 2. Micro veins — finest detail network */
      micros.forEach(function (mp) {
        var hit = false;
        for (var m = 0; m < mp.length; m += 4) {
          if (mp[m].y >= elTop - 60 && mp[m].y <= elTop + h + 60) { hit = true; break; }
        }
        if (!hit) return;
        drawSmoothVein(ctx, mp, 0.6, pickC(), rr(cfg.microA[0], cfg.microA[1]), 0, 0, elTop);
      });

      /* 3. Secondary veins */
      sPaths.forEach(function (sp) {
        drawSmoothVein(ctx, sp, rr(cfg.sThick[0], cfg.sThick[1]), pickC(),
          rr(cfg.sAlpha[0], cfg.sAlpha[1]), rr(4, 12), 0, elTop);
      });

      /* 4. Branch veins */
      branches.forEach(function (bp) {
        drawSmoothVein(ctx, bp, rr(cfg.sThick[0], cfg.sThick[1]) * 0.60, pickC(),
          rr(cfg.sAlpha[0], cfg.sAlpha[1]) * 0.70, rr(2, 7), 0, elTop);
      });

      /* 5. Primary veins (on top — boldest) */
      pPaths.forEach(function (pp) {
        drawSmoothVein(ctx, pp, rr(cfg.pThick[0], cfg.pThick[1]), pickC(),
          rr(cfg.pAlpha[0], cfg.pAlpha[1]), rr(8, 22), 0, elTop);
      });

      /* 6. Edge fades for seamless section transitions */
      var fadeAmt = Math.min(120, h * 0.3);

      var fTop = fadeAmt;
      var fBot = fadeAmt;

      if (zi === 0) fTop = fadeAmt * 0.2;
      if (zi === zones.length - 1) fBot = 0;

      /* Adjacent dark zones: minimal fading between them */
      if (zi > 0) {
        var prevEl = zones[zi - 1].el;
        var prevBottom = prevEl.getBoundingClientRect().top + scrollT + prevEl.getBoundingClientRect().height;
        if (elTop - prevBottom < 300) fTop = fadeAmt * 0.08;
      }
      if (zi < zones.length - 1) {
        var nextEl = zones[zi + 1].el;
        var nextTop = nextEl.getBoundingClientRect().top + scrollT;
        if (nextTop - (elTop + h) < 300) fBot = fadeAmt * 0.08;
      }

      drawFades(ctx, w, h, fTop, fBot);

      /* ── Insert canvas + shimmer + ambient glow ── */
      var wrap = document.createElement('div');
      wrap.className = 'marble-vein-layer marble-breathing';
      wrap.setAttribute('aria-hidden', 'true');
      wrap.appendChild(canvas);

      /* Shimmer light sweep overlay */
      var shimmer = document.createElement('div');
      shimmer.className = 'marble-shimmer';
      shimmer.setAttribute('aria-hidden', 'true');
      /* Stagger shimmer timing per zone for organic feel */
      shimmer.style.animationDelay = (zi * 2.5) + 's';
      shimmer.style.animationDuration = (10 + zi * 1.5) + 's';
      wrap.appendChild(shimmer);

      /* Ambient floating glow */
      if (zone.type !== 'wave' && h > 100) {
        var ambGlow = document.createElement('div');
        ambGlow.className = 'marble-ambient-glow';
        ambGlow.setAttribute('aria-hidden', 'true');
        wrap.appendChild(ambGlow);
      }

      var pos = getComputedStyle(el).position;
      if (pos === 'static') el.style.position = 'relative';

      el.insertBefore(wrap, el.firstChild);
    });
  }

  /* ═══════════════ BOOT ═══════════════ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      requestAnimationFrame(initMarble);
    });
  } else {
    requestAnimationFrame(initMarble);
  }
})();
