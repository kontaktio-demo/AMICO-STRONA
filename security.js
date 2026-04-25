"use strict";
(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  document.addEventListener("contextmenu", function (e) {
    var t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
    e.preventDefault();
  }, false);

  document.addEventListener("dragstart", function (e) {
    var t = e.target;
    if (t && (t.tagName === "IMG" || t.tagName === "PICTURE")) e.preventDefault();
  }, false);

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

  var noSelectSel = ".hero-single, .hero-premium, .service-tile, .gallery-preview-item, .footer-brand";
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(noSelectSel).forEach(function (el) {
      el.style.userSelect = "none";
      el.style.webkitUserSelect = "none";
    });
  });

  if (location.protocol === "https:" && !/(localhost|127\.|192\.168\.)/.test(location.hostname)) {
    try {
      var noop = function () {};
      ["log", "info", "debug", "warn"].forEach(function (m) {
        if (window.console && console[m]) console[m] = noop;
      });
    } catch (_) {  }
  }
})();
