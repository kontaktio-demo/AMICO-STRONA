/* AMICO-STRONA — lightweight client-side source-view deterrents.
   NOTE: HTML/CSS/JS delivered to the browser cannot be truly hidden;
   these handlers make casual inspection and image-saving inconvenient. */
"use strict";
(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  // 1) Disable native context menu globally (still allow inputs/textareas
  //    so users can paste into the contact form on mobile).
  document.addEventListener("contextmenu", function (e) {
    var t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    e.preventDefault();
  }, false);

  // 2) Prevent dragging images out of the page.
  document.addEventListener("dragstart", function (e) {
    var t = e.target;
    if (t && (t.tagName === "IMG" || t.tagName === "PICTURE")) e.preventDefault();
  }, false);

  // 3) Block common DevTools / view-source keyboard shortcuts.
  document.addEventListener("keydown", function (e) {
    var k = (e.key || "").toLowerCase();
    var ctrl = e.ctrlKey || e.metaKey;
    var blockedFn = (k === "f12");
    var blockedCombo =
      (ctrl && e.shiftKey && (k === "i" || k === "j" || k === "c")) ||
      (ctrl && (k === "u" || k === "s"));
    if (blockedFn || blockedCombo) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);

  // 4) Disable text selection on visual decorative blocks (not on copy-friendly content).
  var noSelectSel = ".hero-single, .hero-premium, .service-tile, .gallery-preview-item, .footer-brand";
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(noSelectSel).forEach(function (el) {
      el.style.userSelect = "none";
      el.style.webkitUserSelect = "none";
    });
  });

  // 5) Strip console output in production-like contexts to discourage probing.
  if (location.protocol === "https:" && !/(localhost|127\.|192\.168\.)/.test(location.hostname)) {
    try {
      var noop = function () {};
      ["log", "info", "debug", "warn"].forEach(function (m) {
        if (window.console && console[m]) console[m] = noop;
      });
    } catch (_) { /* noop */ }
  }
})();
