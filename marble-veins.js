/* ═══════════════════════════════════════════════════════════════════════════
   MARBLE VEINS v2 — Full-page continuous marble slab vein generator
   Creates photo-realistic marble vein patterns that flow continuously
   through dark sections, pause at image sections, and continue into
   the footer — like one giant slab of stone behind the page.
   Activated via data-marble-theme on <body>.
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var theme = document.body.getAttribute('data-marble-theme');
  if (!theme) return;

  /* ═══════════════ PRNG & NOISE ═══════════════ */

  function prng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

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

  /* Domain warping — key to realistic marble vein "folds" */
  function domainWarp(noise, x, y, oct, str) {
    var q0 = fbm(noise, x, y, oct);
    var q1 = fbm(noise, x + 5.2, y + 1.3, oct);
    return fbm(noise, x + str * q0, y + str * q1, oct);
  }

  /* Double domain warp for extra organic complexity */
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
      angle: 32, primaryN: 4, secondaryN: 9, microN: 0.6,
      pThick: [2.5,6.0], sThick: [0.8,2.4],
      pAlpha: [0.26,0.44], sAlpha: [0.09,0.22],
      glow: 0.55, warp: 3.5, branchP: 0.72, branchN: [3,8],
      microA: [0.03,0.10], patches: 8
    },
    carrara: {
      seed: 73,
      colors: [[180,195,220],[150,170,200],[200,215,240],[215,228,248],[160,175,195]],
      ambient: [190,205,230],
      angle: -18, primaryN: 5, secondaryN: 11, microN: 0.75,
      pThick: [2.0,5.0], sThick: [0.5,1.8],
      pAlpha: [0.20,0.36], sAlpha: [0.07,0.18],
      glow: 0.45, warp: 3.0, branchP: 0.65, branchN: [3,7],
      microA: [0.02,0.08], patches: 9
    },
    'nero-marquina': {
      seed: 137,
      colors: [[255,255,255],[220,220,240],[240,240,255],[250,248,255],[200,200,220]],
      ambient: [230,230,245],
      angle: 50, primaryN: 3, secondaryN: 7, microN: 0.5,
      pThick: [3.0,7.0], sThick: [1.0,2.8],
      pAlpha: [0.28,0.50], sAlpha: [0.11,0.25],
      glow: 0.62, warp: 4.0, branchP: 0.6, branchN: [2,5],
      microA: [0.04,0.13], patches: 6
    },
    emperador: {
      seed: 211,
      colors: [[200,150,85],[175,125,70],[220,175,110],[235,195,130],[180,140,90]],
      ambient: [210,165,100],
      angle: -38, primaryN: 5, secondaryN: 10, microN: 0.7,
      pThick: [2.2,5.4], sThick: [0.7,2.0],
      pAlpha: [0.24,0.40], sAlpha: [0.09,0.20],
      glow: 0.50, warp: 3.2, branchP: 0.72, branchN: [3,7],
      microA: [0.03,0.09], patches: 8
    },
    levanto: {
      seed: 307,
      colors: [[210,105,80],[160,75,60],[230,135,105],[245,155,125],[180,95,75]],
      ambient: [200,120,95],
      angle: 22, primaryN: 4, secondaryN: 8, microN: 0.55,
      pThick: [2.5,5.8], sThick: [0.8,2.2],
      pAlpha: [0.25,0.42], sAlpha: [0.09,0.22],
      glow: 0.52, warp: 3.5, branchP: 0.65, branchN: [3,6],
      microA: [0.03,0.10], patches: 7
    },
    portoro: {
      seed: 401,
      colors: [[240,210,95],[210,180,65],[255,230,130],[250,235,150],[200,175,80]],
      ambient: [230,205,100],
      angle: -52, primaryN: 3, secondaryN: 7, microN: 0.45,
      pThick: [2.8,6.5], sThick: [1.0,2.6],
      pAlpha: [0.27,0.46], sAlpha: [0.11,0.24],
      glow: 0.58, warp: 3.8, branchP: 0.60, branchN: [2,5],
      microA: [0.04,0.12], patches: 6
    },
    guatemala: {
      seed: 509,
      colors: [[90,175,120],[60,140,95],[120,200,150],[140,215,165],[75,155,105]],
      ambient: [100,185,130],
      angle: 28, primaryN: 4, secondaryN: 9, microN: 0.65,
      pThick: [2.2,5.2], sThick: [0.7,2.0],
      pAlpha: [0.22,0.38], sAlpha: [0.08,0.20],
      glow: 0.48, warp: 3.2, branchP: 0.68, branchN: [3,7],
      microA: [0.03,0.09], patches: 7
    },
    sodalite: {
      seed: 613,
      colors: [[95,125,210],[65,100,175],[125,155,235],[145,170,248],[80,110,190]],
      ambient: [105,140,220],
      angle: -28, primaryN: 4, secondaryN: 8, microN: 0.6,
      pThick: [2.4,5.5], sThick: [0.8,2.2],
      pAlpha: [0.24,0.40], sAlpha: [0.09,0.20],
      glow: 0.50, warp: 3.4, branchP: 0.65, branchN: [3,6],
      microA: [0.03,0.10], patches: 7
    },
    'silver-wave': {
      seed: 719,
      colors: [[210,215,230],[180,185,200],[230,235,248],[240,242,252],[195,200,215]],
      ambient: [220,225,240],
      angle: 42, primaryN: 5, secondaryN: 11, microN: 0.8,
      pThick: [1.8,4.2], sThick: [0.5,1.5],
      pAlpha: [0.18,0.34], sAlpha: [0.07,0.16],
      glow: 0.40, warp: 2.8, branchP: 0.70, branchN: [4,9],
      microA: [0.02,0.08], patches: 9
    },
    statuario: {
      seed: 827,
      colors: [[200,200,220],[165,165,185],[225,225,245],[240,240,255],[185,185,205]],
      ambient: [210,210,230],
      angle: -48, primaryN: 4, secondaryN: 8, microN: 0.55,
      pThick: [2.8,6.2], sThick: [0.9,2.5],
      pAlpha: [0.26,0.44], sAlpha: [0.10,0.22],
      glow: 0.55, warp: 3.6, branchP: 0.62, branchN: [2,6],
      microA: [0.04,0.11], patches: 7
    },
    arabescato: {
      seed: 937,
      colors: [[195,185,210],[165,155,180],[220,210,235],[235,225,248],[180,170,195]],
      ambient: [205,195,220],
      angle: 18, primaryN: 6, secondaryN: 13, microN: 0.85,
      pThick: [1.6,4.0], sThick: [0.4,1.4],
      pAlpha: [0.16,0.32], sAlpha: [0.06,0.15],
      glow: 0.38, warp: 2.6, branchP: 0.76, branchN: [4,10],
      microA: [0.02,0.07], patches: 10
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

  function genVein(noise, noise2, idx, pw, ph, primary) {
    var aRad = (cfg.angle + idx * (primary ? 7 : 13) + (_rand() - 0.5) * 10) * Math.PI / 180;
    var cosA = Math.cos(aRad), sinA = Math.sin(aRad);
    var vn = createNoise(cfg.seed + idx * 31 + 700);
    var vn2 = createNoise(cfg.seed + idx * 47 + 1100);

    var total = cfg.primaryN + cfg.secondaryN;
    var frac = (idx + _rand() * 0.5) / total;
    var diag = Math.sqrt(pw * pw + ph * ph);
    var perpOff = frac * diag * 1.15 - diag * 0.075;

    var wFreq = 0.0003 + _rand() * 0.001;
    var wAmp = primary ? (50 + _rand() * 120) : (20 + _rand() * 70);
    var warpAmt = cfg.warp * (primary ? 1.0 : 0.6);

    var pts = [];
    var len = diag * 1.7;
    var step = primary ? 2.5 : 4;

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

      /* Organic thickness variation */
      var tv = 0.12 + 0.88 * Math.pow(
        0.5 + 0.5 * Math.sin(t * Math.PI * (1.3 + _rand() * 2.5) + idx * 0.9), 1.8
      );
      /* Taper at endpoints */
      var tap = 1;
      if (t < 0.06) tap = t / 0.06;
      else if (t > 0.94) tap = (1 - t) / 0.06;
      tv *= tap;

      pts.push({ x: px, y: py, t: t, th: tv });
    }
    return pts;
  }

  function genBranches(mainPts, idx) {
    if (_rand() > cfg.branchP) return [];
    var brs = [];
    var nb = cfg.branchN[0] + Math.floor(_rand() * (cfg.branchN[1] - cfg.branchN[0]));

    for (var b = 0; b < nb; b++) {
      var bi = Math.floor((0.08 + _rand() * 0.78) * mainPts.length);
      var o = mainPts[Math.min(bi, mainPts.length - 1)];
      var ba = (cfg.angle + idx * 7) * Math.PI / 180 + (_rand() - 0.5) * 2.0;
      var bl = 40 + _rand() * 280;
      var bn = createNoise(cfg.seed + idx * 31 + b * 17 + 3000);
      var bn2 = createNoise(cfg.seed + idx * 31 + b * 23 + 3500);

      var pts = [];
      var bx = o.x, by = o.y;
      for (var s = 0; s < bl; s += 2) {
        var bt = s / bl;
        var noise1 = fbm(bn, bt * 4, b * 2.1, 3) * 40;
        var noise2 = fbm(bn2, bt * 3, b * 1.7, 2) * 20;
        bx += Math.cos(ba + (noise1 + noise2) * 0.006) * 2;
        by += Math.sin(ba + (noise1 + noise2) * 0.006) * 2;
        var tap = Math.pow(1 - bt, 1.8) * Math.min(1, bt * 8);
        pts.push({ x: bx, y: by, t: bt, th: tap });
      }

      /* Sub-branches off this branch */
      if (_rand() > 0.5 && pts.length > 20) {
        var sbi = Math.floor((0.2 + _rand() * 0.5) * pts.length);
        var sbo = pts[Math.min(sbi, pts.length - 1)];
        var sba = ba + (_rand() - 0.5) * 1.6;
        var sbl = 20 + _rand() * 80;
        var sbn = createNoise(cfg.seed + idx * 31 + b * 41 + 4000);
        var sub = [];
        var sbx = sbo.x, sby = sbo.y;
        for (var ss = 0; ss < sbl; ss += 2) {
          var st = ss / sbl;
          var sn = fbm(sbn, st * 5, b * 3, 2) * 20;
          sbx += Math.cos(sba + sn * 0.008) * 2;
          sby += Math.sin(sba + sn * 0.008) * 2;
          sub.push({ x: sbx, y: sby, t: st, th: Math.pow(1 - st, 2.2) * Math.min(1, st * 10) });
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
    var cnt = Math.floor(20 * cfg.microN + _rand() * 12);
    for (var m = 0; m < cnt; m++) {
      var sx = _rand() * pw, sy = _rand() * ph;
      var a = (cfg.angle + _rand() * 70 - 35) * Math.PI / 180;
      var l = 20 + _rand() * 150;
      var mn = createNoise(cfg.seed + m * 41 + 5000);
      var pts = [];
      for (var s = 0; s <= l; s += 1.5) {
        var t = s / l;
        var n = fbm(mn, t * 7, m * 1.5, 3) * 18;
        pts.push({
          x: sx + Math.cos(a + n * 0.012) * s,
          y: sy + Math.sin(a + n * 0.012) * s,
          t: t,
          th: Math.sin(t * Math.PI) * (0.3 + _rand() * 0.7)
        });
      }
      paths.push(pts);
    }
    return paths;
  }

  /* ═══════════════ CANVAS RENDERING ═══════════════ */

  function drawPath(ctx, pts, baseW, color, alpha, glowR, ox, oy) {
    if (pts.length < 2) return;

    /* Wide soft glow (deep light within the stone) */
    if (glowR > 10) {
      ctx.save();
      ctx.globalAlpha = alpha * 0.12 * cfg.glow;
      ctx.strokeStyle = rgba(color, 1);
      ctx.lineWidth = baseW + glowR * 3;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.filter = 'blur(' + Math.round(glowR * 1.5) + 'px)';
      ctx.beginPath();
      for (var k = 0; k < pts.length; k += 6) {
        var p = pts[k];
        if (k === 0) ctx.moveTo(p.x - ox, p.y - oy);
        else ctx.lineTo(p.x - ox, p.y - oy);
      }
      ctx.stroke(); ctx.restore();
    }

    /* Medium glow halo */
    if (glowR > 0) {
      ctx.save();
      ctx.globalAlpha = alpha * 0.3 * cfg.glow;
      ctx.strokeStyle = rgba(color, 1);
      ctx.lineWidth = baseW + glowR;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.filter = 'blur(' + Math.round(glowR * 0.5) + 'px)';
      ctx.beginPath();
      for (var g = 0; g < pts.length; g += 3) {
        var pg = pts[g];
        if (g === 0) ctx.moveTo(pg.x - ox, pg.y - oy);
        else ctx.lineTo(pg.x - ox, pg.y - oy);
      }
      ctx.stroke(); ctx.restore();
    }

    /* Core vein with variable width segments */
    ctx.save();
    ctx.strokeStyle = rgba(color, 1);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    for (var i = 1; i < pts.length; i++) {
      var pr = pts[i - 1], cr = pts[i];
      var w = baseW * cr.th;
      if (w < 0.15) continue;
      ctx.globalAlpha = alpha * (0.6 + 0.4 * cr.th);
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(pr.x - ox, pr.y - oy);
      ctx.lineTo(cr.x - ox, cr.y - oy);
      ctx.stroke();
    }
    ctx.restore();

    /* Bright center highlight on thick veins */
    if (baseW > 3) {
      ctx.save();
      ctx.strokeStyle = rgba([
        Math.min(255, color[0] + 40),
        Math.min(255, color[1] + 40),
        Math.min(255, color[2] + 40)
      ], 1);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (var h = 1; h < pts.length; h += 2) {
        var ph2 = pts[h - 1], ch = pts[h];
        var hw = baseW * ch.th * 0.3;
        if (hw < 0.3) continue;
        ctx.globalAlpha = alpha * 0.35 * ch.th;
        ctx.lineWidth = hw;
        ctx.beginPath();
        ctx.moveTo(ph2.x - ox, ph2.y - oy);
        ctx.lineTo(ch.x - ox, ch.y - oy);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawAmbient(ctx, w, h, elTop, pageH) {
    var an = createNoise(cfg.seed + 9999);

    /* Large ambient color patches — simulate depth and color variation in stone */
    for (var p = 0; p < cfg.patches; p++) {
      var px = _rand() * w, py = _rand() * h;
      var rad = Math.min(w, h) * (0.18 + _rand() * 0.5);
      var c = _rand() > 0.4 ? cfg.ambient : pickC();
      var nv = (fbm(an, (px + elTop) * 0.0008, (py + elTop) * 0.0008, 4) + 1) * 0.5;
      var op = 0.025 + nv * 0.04;

      var gr = ctx.createRadialGradient(px, py, 0, px, py, rad);
      gr.addColorStop(0, rgba(c, op * 1.3));
      gr.addColorStop(0.25, rgba(c, op));
      gr.addColorStop(0.55, rgba(c, op * 0.5));
      gr.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, w, h);
    }

    /* Full-surface polished stone wash */
    for (var t = 0; t < 4; t++) {
      var tx = _rand() * w * 0.6 + w * 0.2;
      var ty = _rand() * h * 0.6 + h * 0.2;
      var tr = Math.max(w, h) * (0.4 + _rand() * 0.6);
      var tc = pickC();
      var tg = ctx.createRadialGradient(tx, ty, 0, tx, ty, tr);
      tg.addColorStop(0, rgba(tc, 0.015));
      tg.addColorStop(0.5, rgba(tc, 0.006));
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
    lg.addColorStop(0, rgba(lc, 0.008));
    lg.addColorStop(0.3, rgba(lc, 0.015));
    lg.addColorStop(0.7, rgba(lc, 0.005));
    lg.addColorStop(1, rgba(lc, 0.010));
    ctx.fillStyle = lg;
    ctx.fillRect(0, 0, w, h);
  }

  /* ═══════════════ EDGE FADES ═══════════════ */

  function drawFades(ctx, w, h, fTop, fBot) {
    if (fTop > 0) {
      var gt = ctx.createLinearGradient(0, 0, 0, fTop);
      gt.addColorStop(0, 'rgba(0,0,0,1)');
      gt.addColorStop(0.5, 'rgba(0,0,0,0.4)');
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
      gb.addColorStop(0.5, 'rgba(0,0,0,0.4)');
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

    /* Also target plain .section without bg-alt that don't have has-bg */
    document.querySelectorAll('.section:not(.has-bg):not(.bg-alt):not(.agd-brands-section)').forEach(function (el) {
      zones.push({ el: el, type: 'section' });
    });

    /* footer-wave-transition */
    var fw = document.querySelector('.footer-wave-transition');
    if (fw) zones.push({ el: fw, type: 'wave' });

    /* Footer */
    var footer = document.querySelector('.footer');
    if (footer) zones.push({ el: footer, type: 'footer' });

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

      /* Canvas resolution — balance quality and perf */
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var maxW = 1920;
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

      /* 2. Micro veins */
      micros.forEach(function (mp) {
        var hit = false;
        for (var m = 0; m < mp.length; m += 3) {
          if (mp[m].y >= elTop - 50 && mp[m].y <= elTop + h + 50) { hit = true; break; }
        }
        if (!hit) return;
        drawPath(ctx, mp, 0.7, pickC(), rr(cfg.microA[0], cfg.microA[1]), 0, 0, elTop);
      });

      /* 3. Secondary veins */
      sPaths.forEach(function (sp) {
        drawPath(ctx, sp, rr(cfg.sThick[0], cfg.sThick[1]), pickC(),
          rr(cfg.sAlpha[0], cfg.sAlpha[1]), rr(4, 10), 0, elTop);
      });

      /* 4. Branch veins */
      branches.forEach(function (bp) {
        drawPath(ctx, bp, rr(cfg.sThick[0], cfg.sThick[1]) * 0.65, pickC(),
          rr(cfg.sAlpha[0], cfg.sAlpha[1]) * 0.75, rr(2, 6), 0, elTop);
      });

      /* 5. Primary veins (on top) */
      pPaths.forEach(function (pp) {
        drawPath(ctx, pp, rr(cfg.pThick[0], cfg.pThick[1]), pickC(),
          rr(cfg.pAlpha[0], cfg.pAlpha[1]), rr(8, 20), 0, elTop);
      });

      /* 6. Edge fades for seamless section transitions */
      var fadeAmt = Math.min(100, h * 0.3);

      /* Compute contextual fading */
      var fTop = fadeAmt;
      var fBot = fadeAmt;

      /* First zone: subtle top fade; last zone: no bottom fade */
      if (zi === 0) fTop = fadeAmt * 0.25;
      if (zi === zones.length - 1) fBot = 0;

      /* Adjacent dark zones: minimal fading between them */
      if (zi > 0) {
        var prevEl = zones[zi - 1].el;
        var prevBottom = prevEl.getBoundingClientRect().top + scrollT + prevEl.getBoundingClientRect().height;
        if (elTop - prevBottom < 250) fTop = fadeAmt * 0.1;
      }
      if (zi < zones.length - 1) {
        var nextEl = zones[zi + 1].el;
        var nextTop = nextEl.getBoundingClientRect().top + scrollT;
        if (nextTop - (elTop + h) < 250) fBot = fadeAmt * 0.1;
      }

      /* Wave transitions: no fading */
      if (zone.type === 'wave') { fTop = 0; fBot = 0; }
      /* Footer: gentle top fade, no bottom */
      if (zone.type === 'footer') { fTop = fadeAmt * 0.6; fBot = 0; }

      drawFades(ctx, w, h, fTop, fBot);

      /* ── Insert canvas ── */
      var wrap = document.createElement('div');
      wrap.className = 'marble-vein-layer' + (zone.type === 'footer' ? ' marble-vein-footer' : '');
      wrap.setAttribute('aria-hidden', 'true');
      wrap.appendChild(canvas);

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

